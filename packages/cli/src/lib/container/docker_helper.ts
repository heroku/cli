import {ux} from '@oclif/core'
import {glob} from 'glob'
import inquirer from 'inquirer'
import Child from 'node:child_process'
import os from 'node:os'
import Path from 'node:path'

import {debug} from './debug.js'

const DOCKERFILE_REGEX = /\bDockerfile(.\w*)?$/

export type CmdOptions = {
  input?: string
  output?: boolean
}

export type DockerJob = {
  depth: number,
  dockerfile: string,
  name: string,
  postfix: number,
  resource: string,
}

export type GroupedDockerJobs = {
  [processType: string]: DockerJob[],
}

type BuildImageParams = {
  arch?: string,
  buildArgs: string[],
  dockerfile: string,
  path?: string,
  resource: string,
}

export class DockerHelper {
  async buildImage({arch, buildArgs, dockerfile, path, resource}: BuildImageParams): Promise<string> {
    const cwd = path || Path.dirname(dockerfile)
    const args = ['build', '-f', dockerfile, '-t', resource]
    // Older Docker versions don't allow for this flag, but we are
    // adding it here when necessary to allow for pushing a docker build from m1/m2 Macs.
    if (arch === 'arm64' || arch === 'aarch64') args.push('--platform', 'linux/amd64')

    // newer docker versions support attestations and software bill of materials, so we want to disable them to save time/space
    // Heroku's container registry doesn't support pushing them right now
    if (await this.version() >= [24, 0, 0]) {
      args.push('--provenance', 'false', '--sbom', 'false')
    }

    for (const element of buildArgs) {
      if (element.length > 0) {
        args.push('--build-arg', element)
      }
    }

    args.push(cwd)

    return this.cmd('docker', args)
  }

  async chooseJobs(jobs: GroupedDockerJobs): Promise<DockerJob[]> {
    const chosenJobs = [] as DockerJob[]

    for (const processType in jobs) {
      if (Object.hasOwn(jobs, processType)) {
        const group = jobs[processType]
        if (group === undefined) {
          ux.warn(`Dockerfile.${processType} not found`)
          continue
        }

        if (group.length > 1) {
          const prompt = [{
            choices: group.map(j => j.dockerfile),
            message: `Found multiple Dockerfiles with process type ${processType}. Please choose one to build and push `,
            name: processType,
            type: 'list',
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

  async cmd(cmd: string, args: string[], options: CmdOptions = {}): Promise<string> {
    debug(cmd, args)

    const stdio = [
      options.input ? 'pipe' : process.stdin,
      options.output ? 'pipe' : process.stdout,
      process.stderr,
    ] as Child.StdioOptions

    return new Promise((resolve, reject) => {
      const child = Child.spawn(cmd, args, {stdio})

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

  filterByProcessType(jobs: GroupedDockerJobs, processTypes: string[]): GroupedDockerJobs {
    const filteredJobs: GroupedDockerJobs = {}
    processTypes.forEach(processType => {
      filteredJobs[processType] = jobs[processType]
    })
    return filteredJobs
  }

  getDockerfiles(rootdir: string, recursive: boolean): string[] {
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

  getJobs(resourceRoot: string, dockerfiles: string[]): GroupedDockerJobs {
    const jobs: DockerJob[] = []
    dockerfiles.forEach(dockerfile => {
      const match = dockerfile.match(DOCKERFILE_REGEX)
      if (match) {
        const proc = (match[1] || '.standard').slice(1)
        jobs.push({
          depth: Path.normalize(dockerfile).split(Path.sep).length,
          dockerfile,
          name: proc,
          postfix: Path.basename(dockerfile) === 'Dockerfile' ? 0 : 1,
          resource: `${resourceRoot}/${proc}`,
        })
      }
    })

    // prefer closer Dockerfiles, then prefer Dockerfile over Dockerfile.web
    jobs.sort((a, b) => a.depth - b.depth || a.postfix - b.postfix)

    // group all Dockerfiles for the same process type together
    const groupedJobs: GroupedDockerJobs = {}
    jobs.forEach(job => {
      groupedJobs[job.name] = groupedJobs[job.name] || [] as DockerJob[]
      groupedJobs[job.name].push(job)
    })

    return groupedJobs
  }

  async pullImage(resource: string): Promise<string> {
    const args = ['pull', resource]
    return this.cmd('docker', args)
  }

  async pushImage(resource: string, arch: string): Promise<string> {
    const args = ['push', resource]

    // Older Docker versions don't allow for this flag, but we are
    // adding it here when necessary to allow for pushing a docker build from m1/m2 Macs.
    // Heroku's container registry doesn't support pushing multi-arch images so we need to push the expected arch
    if (arch === 'arm64' || arch === 'aarch64') args.push('--platform', 'linux/amd64')

    return this.cmd('docker', args)
  }

  async runImage(resource: string, command: string, port: number): Promise<string> {
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
    return this.cmd('docker', args)
  }

  async version(): Promise<[number, number]> {
    const version = await this.cmd('docker', ['version', '-f', '{{.Client.Version}}'], {output: true})
    const [major, minor] = version.split(/\./)

    return [Number.parseInt(major, 10) || 0, Number.parseInt(minor, 10) || 0] // ensure exactly 2 components
  }
}

// // Create a default instance for backward compatibility
// const defaultDockerHelper = new DockerHelper()

// // Export the class and default instance
// export {defaultDockerHelper}

// // Export all methods as standalone functions for backward compatibility
// export const cmd = (cmd: string, args: string[], options: cmdOptions = {}) => defaultDockerHelper.cmd(cmd, args, options)
// export const version = () => defaultDockerHelper.version()
// export const pullImage = (resource: string) => defaultDockerHelper.pullImage(resource)
// export const getDockerfiles = (rootdir: string, recursive: boolean) => defaultDockerHelper.getDockerfiles(rootdir, recursive)
// export const getJobs = (resourceRoot: string, dockerfiles: string[]) => defaultDockerHelper.getJobs(resourceRoot, dockerfiles)
// export const filterByProcessType = (jobs: groupedDockerJobs, processTypes: string[]) => defaultDockerHelper.filterByProcessType(jobs, processTypes)
// export const chooseJobs = (jobs: groupedDockerJobs) => defaultDockerHelper.chooseJobs(jobs)
// export const buildImage = (params: BuildImageParams) => defaultDockerHelper.buildImage(params)
// export const pushImage = (resource: string) => defaultDockerHelper.pushImage(resource)
// export const runImage = (resource: string, command: string, port: number) => defaultDockerHelper.runImage(resource, command, port)
