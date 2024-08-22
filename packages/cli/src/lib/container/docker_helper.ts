import * as Child from 'child_process'
import {debug} from './debug'
import * as glob from 'glob'
import * as Path from 'path'
import * as inquirer from 'inquirer'
import * as os from 'os'
import {ux} from '@oclif/core'

const DOCKERFILE_REGEX = /\bDockerfile(.\w*)?$/

export type cmdOptions = {
  output?: boolean
  input?: string
}

export const cmd = async function (cmd: string, args: string[], options: cmdOptions = {}): Promise<string> {
  debug(cmd, args)

  const stdio = [
    options.input ? 'pipe' : process.stdin,
    options.output ? 'pipe' : process.stdout,
    process.stderr,
  ] as Child.StdioOptions

  return new Promise((resolve, reject) => {
    const child = Child.spawn(cmd, args, {stdio: stdio})

    if (child.stdin) {
      child.stdin.end(options.input)
    }

    let stdout: string
    if (child.stdout) {
      stdout = ''
      child.stdout.on('data', data => {
        stdout += data.toString()
      })
    }

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT' && err.path === 'docker') {
        reject(new Error(`Cannot find docker, please ensure docker is installed.
        If you need help installing docker, visit https://docs.docker.com/install/#supported-platforms`))
      } else {
        reject(err)
      }
    })

    child.on('exit', (code, signal) => {
      if (signal || code) {
        reject(new Error(signal || code?.toString()))
      } else {
        resolve(stdout)
      }
    })
  })
}

export const version = async function () {
  const version = await cmd('docker', ['version', '-f', '{{.Client.Version}}'], {output: true})
  const [major, minor] = version.split(/\./)

  return [Number.parseInt(major, 10) || 0, Number.parseInt(minor, 10) || 0] // ensure exactly 2 components
}

export const pullImage = function (resource: string) {
  const args = ['pull', resource]
  return cmd('docker', args)
}

export const getDockerfiles = function (rootdir: string, recursive: boolean) {
  const match = recursive ? './**/Dockerfile?(.)*' : 'Dockerfile*'
  let dockerfiles = glob.sync(match, {
    cwd: rootdir,
    nodir: true,
  })

  if (recursive) {
    dockerfiles = dockerfiles.filter(df => df.match(/Dockerfile\.[\w]+$/))
  } else {
    dockerfiles = dockerfiles.filter(df => df.match(/Dockerfile$/))
  }

  return dockerfiles.map(file => Path.join(rootdir, file))
}

export type dockerJob = {
  name: string,
  resource: string,
  dockerfile: string,
  postfix: number,
  depth: number,
}

export type groupedDockerJobs = {
  [processType: string]: dockerJob[],
}

export const getJobs = function (resourceRoot: string, dockerfiles: string[]) {
  const jobs: dockerJob[] = []
  dockerfiles.forEach(dockerfile => {
    const match = dockerfile.match(DOCKERFILE_REGEX)
    if (match) {
      const proc = (match[1] || '.standard').slice(1)
      jobs.push({
        name: proc,
        resource: `${resourceRoot}/${proc}`,
        dockerfile: dockerfile,
        postfix: Path.basename(dockerfile) === 'Dockerfile' ? 0 : 1,
        depth: Path.normalize(dockerfile).split(Path.sep).length,
      })
    }
  })

  // prefer closer Dockerfiles, then prefer Dockerfile over Dockerfile.web
  jobs.sort((a, b) => {
    return a.depth - b.depth || a.postfix - b.postfix
  })

  // group all Dockerfiles for the same process type together
  const groupedJobs: groupedDockerJobs = {}
  jobs.forEach(job => {
    groupedJobs[job.name] = groupedJobs[job.name] || [] as dockerJob[]
    groupedJobs[job.name].push(job)
  })

  return groupedJobs
}

export const filterByProcessType = function (jobs: groupedDockerJobs, processTypes: string[]) {
  const filteredJobs: groupedDockerJobs = {}
  processTypes.forEach(processType => {
    filteredJobs[processType] = jobs[processType]
  })
  return filteredJobs
}

export const chooseJobs = async function (jobs: groupedDockerJobs) {
  const chosenJobs = [] as dockerJob[]

  for (const processType in jobs) {
    if (Object.prototype.hasOwnProperty.call(jobs, processType)) {
      const group = jobs[processType]
      if (group === undefined) {
        ux.warn(`Dockerfile.${processType} not found`)
        continue
      }

      if (group.length > 1) {
        const prompt = [{
          type: 'list',
          name: processType,
          choices: group.map(j => j.dockerfile),
          message: `Found multiple Dockerfiles with process type ${processType}. Please choose one to build and push `,
        }] as inquirer.QuestionCollection

        const answer = await inquirer.prompt(prompt)
        const found = group.find(o => o.dockerfile === answer[processType])

        if (found) {
          chosenJobs.push(found)
        }
      } else {
        chosenJobs.push(group[0])
      }
    }
  }

  return chosenJobs
}

export const buildImage = async function (dockerfile: string, resource: string, buildArgs: string[], path?: string) {
  const cwd = path || Path.dirname(dockerfile)
  const args = ['build', '-f', dockerfile, '-t', resource, '--platform', 'linux/amd64']

  for (const element of buildArgs) {
    if (element.length > 0) {
      args.push('--build-arg', element)
    }
  }

  args.push(cwd)

  return cmd('docker', args)
}

export const pushImage = async function (resource: string) {
  const args = ['push', resource]

  return cmd('docker', args)
}

export const runImage = function (resource: string, command: string, port: number) {
  const args: string[] = [
    'run',
    '--user',
    os.userInfo().uid.toString(),
    '-e',
    `PORT=${port}`,
    '-it',
    resource,
    command,
  ]
  return cmd('docker', args)
}
