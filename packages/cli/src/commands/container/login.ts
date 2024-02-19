import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as DockerHelper from '../../lib/container/docker_helper'
import {debug} from '../../lib/container/debug'

async function dockerLogin(registry: string, password: string) {
  const [major, minor] = await DockerHelper.version()

  if (major > 17 || (major === 17 && minor >= 7)) {
    return dockerLoginStdin(registry, password)
  }

  return dockerLoginArgv(registry, password)
}

function dockerLoginStdin(registry: string, password: string) {
  const args = [
    'login',
    '--username=_',
    '--password-stdin',
    registry,
  ]
  return DockerHelper.cmd('docker', args, {input: password})
}

function dockerLoginArgv(registry: string, password: string) {
  const args = [
    'login',
    '--username=_',
    `--password=${password}`,
    registry,
  ]
  return DockerHelper.cmd('docker', args)
}

export default class Login extends Command {
  static topic = 'container'
  static description = 'log in to Heroku Container Registry'
  static flags = {
    verbose: flags.boolean({char: 'v'}),
  }

  async run() {
    const {flags} = await this.parse(Login)
    const {verbose} = flags
    const herokuHost = process.env.HEROKU_HOST || 'heroku.com'
    const registry = `registry.${herokuHost}`
    const password = this.heroku.auth

    if (verbose) {
      debug.enabled = true
    }

    if (!password) throw new Error('not logged in')

    try {
      await dockerLogin(registry, password)
    } catch (error: any) {
      ux.error(`Login failed${error.hasProperty('message') ? ` with: ${error.message}` : ''}.`, {exit: 1})
    }
  }
}
