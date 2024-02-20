import * as Child from 'child_process'
import {debug} from './debug'

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
