// 'sanbashi' is a word in Japanese that refers to a pier or dock, usually very large in size, such as found in Tokyo's O-daiba region

let Glob = require('glob')
let Path = require('path')
let Inquirer = require('inquirer')
let os = require('os')
const Child = require('child_process')
const debug = require('./debug')

const DOCKERFILE_REGEX = /\bDockerfile(.\w*)?$/
let Sanbashi = function () {}

Sanbashi.getDockerfiles = function (rootdir, recursive) {
  let match = recursive ? './**/Dockerfile?(.)*' : 'Dockerfile*'
  let dockerfiles = Glob.sync(match, {
    cwd: rootdir,
    nonull: false,
    nodir: true,
  })
  if (recursive) {
    dockerfiles = dockerfiles.filter(df => df.match(/Dockerfile\.[\w]+$/))
  } else {
    dockerfiles = dockerfiles.filter(df => df.match(/Dockerfile$/))
  }

  return dockerfiles.map(file => Path.join(rootdir, file))
}

Sanbashi.getJobs = function (resourceRoot, dockerfiles) {
  return dockerfiles
  // convert all Dockerfiles into job Objects
    .map(dockerfile => {
      let match = dockerfile.match(DOCKERFILE_REGEX)
      if (!match) return
      let proc = (match[1] || '.standard').slice(1)
      return {
        name: proc,
        resource: `${resourceRoot}/${proc}`,
        dockerfile: dockerfile,
        postfix: Path.basename(dockerfile) === 'Dockerfile' ? 0 : 1,
        depth: Path.normalize(dockerfile).split(Path.sep).length,
      }
    })
  // prefer closer Dockerfiles, then prefer Dockerfile over Dockerfile.web
    .sort((a, b) => {
      return a.depth - b.depth || a.postfix - b.postfix
    })
  // group all Dockerfiles for the same process type together
    .reduce((jobs, job) => {
      jobs[job.name] = jobs[job.name] || []
      jobs[job.name].push(job)
      return jobs
    }, {})
}

Sanbashi.chooseJobs = async function (jobs) {
  let chosenJobs = []
  // eslint-disable-next-line guard-for-in
  for (let processType in jobs) {
    let group = jobs[processType]
    if (group.length > 1) {
      let prompt = {
        type: 'list',
        name: processType,
        choices: group.map(j => j.dockerfile),
        message: `Found multiple Dockerfiles with process type ${processType}. Please choose one to build and push `,
      }
      let answer = await Inquirer.prompt(prompt)
      chosenJobs.push(group.find(o => o.dockerfile === answer[processType]))
    } else {
      chosenJobs.push(group[0])
    }
  }

  return chosenJobs
}

Sanbashi.filterByProcessType = function (jobs, procs) {
  let filteredJobs = {}
  procs.forEach(processType => {
    filteredJobs[processType] = jobs[processType]
  })
  return filteredJobs
}

Sanbashi.buildImage = function (dockerfile, resource, buildArg, path) {
  let cwd = path || Path.dirname(dockerfile)
  let args = ['build', '-f', dockerfile, '-t', resource]

  for (const element of buildArg) {
    if (element.length > 0) {
      args.push('--build-arg')
      // eslint-disable-next-line unicorn/no-array-push-push
      args.push(element)
    }
  }

  args.push(cwd)
  return Sanbashi.cmd('docker', args)
}

Sanbashi.pushImage = function (resource) {
  let args = ['push', resource]
  return Sanbashi.cmd('docker', args)
}

Sanbashi.pullImage = function (resource) {
  let args = ['pull', resource]
  return Sanbashi.cmd('docker', args)
}

Sanbashi.runImage = function (resource, command, port) {
  let args = ['run', '--user', os.userInfo().uid, '-e', `PORT=${port}`]
  if (command === '') {
    args.push(resource)
  } else {
    args.push('-it', resource, command)
  }

  return Sanbashi.cmd('docker', args)
}

Sanbashi.version = function () {
  return Sanbashi
    .cmd('docker', ['version', '-f', '{{.Client.Version}}'], {output: true})
    .then(version => version.split(/\./))
    .then(([major, minor]) => [Number.parseInt(major) || 0, Number.parseInt(minor) || 0]) // ensure exactly 2 components
}

Sanbashi.imageID = function (tag) {
  return Sanbashi
    .cmd('docker', ['inspect', tag, '--format={{.Id}}'], {output: true})
  // eslint-disable-next-line unicorn/prefer-string-trim-start-end
    .then(id => id.trimRight()) // Trim the new line at the end of the string
}

Sanbashi.cmd = function (cmd, args, options = {}) {
  debug(cmd, args)
  let stdio = [process.stdin, process.stdout, process.stderr]
  if (options.input) {
    stdio[0] = 'pipe'
  }

  if (options.output) {
    stdio[1] = 'pipe'
  }

  return new Promise((resolve, reject) => {
    let child = Child.spawn(cmd, args, {stdio: stdio})

    if (child.stdin) {
      child.stdin.end(options.input)
    }

    let stdout
    if (child.stdout) {
      stdout = ''
      child.stdout.on('data', data => {
        stdout += data.toString()
      })
    }

    child.on('error', err => {
      if (err.code === 'ENOENT' && err.path === 'docker') {
        reject(new Error(`Cannot find docker, please ensure docker is installed.
        If you need help installing docker, visit https://docs.docker.com/install/#supported-platforms`))
      } else {
        reject(err)
      }
    })
    child.on('exit', (code, signal) => {
      if (signal || code) reject(new Error(signal || code))
      else resolve(stdout)
    })
  })
}

module.exports = Sanbashi
