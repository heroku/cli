import * as Child from 'child_process'
import {globSync} from 'glob'
import {debug} from './debug'
import * as path from 'path'
import * as os from 'os'

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
  let dockerfiles: string[] = globSync(match, {
    cwd: rootdir,
    nodir: true,
  })
  if (recursive) {
    dockerfiles = dockerfiles.filter((df: string) => df.match(/Dockerfile\.[\w]+$/))
  } else {
    dockerfiles = dockerfiles.filter((df: string) => df.match(/Dockerfile$/))
  }

  return dockerfiles.map((file: string) => path.join(rootdir, file))
}

export const getJobs = function (resourceRoot: string, dockerfiles: string[]) {
  return dockerfiles
  // convert all Dockerfiles into job Objects
    .map(dockerfile => {
      const match = dockerfile.match(DOCKERFILE_REGEX)
      if (!match) throw new Error(`Invalid Dockerfile: ${dockerfile}`)
      const proc: string = (match[1] || '.standard').slice(1)
      const dockerfileJobs: Record<string, any> = {
        // return {
        name: proc,
        resource: `${resourceRoot}/${proc}`,
        dockerfile: dockerfile,
        postfix: path.basename(dockerfile) === 'Dockerfile' ? 0 : 1,
        depth: path.normalize(dockerfile).split(path.sep).length,
      }
      return dockerfileJobs
      // }
    })
  // prefer closer Dockerfiles, then prefer Dockerfile over Dockerfile.web
    .sort((a, b) => {
      return a.depth - b.depth || a.postfix - b.postfix
    })
  // group all Dockerfiles for the same process type together
    .reduce((jobs, job: Record<string, any>) => {
      // if job.name === undefined) return
      jobs[job.name] = jobs[job.name] || []
      jobs[job.name].push(job)
      return jobs
    }, {})
}

export const runImage = function (resource: string, command: string, port: number) {
  const args: string[] = ['run', '--user', os.userInfo().uid.toString(), '-e', `PORT=${port}`]
  if (command.length === 0) {
    args.push(resource)
  } else {
    args.push('-it', resource, command)
  }

  return cmd('docker', args)
}
