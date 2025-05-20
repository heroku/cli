/*
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {DockerHelper} from '../../lib/container/docker_helper.js'
import {debug} from '../../lib/container/debug.js'

export default class Login extends Command {
  static topic = 'container'
  static description = 'log in to Heroku Container Registry'
  static flags = {
    verbose: flags.boolean({char: 'v'}),
  }

  dockerHelper = new DockerHelper()

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
      await this.dockerLogin(registry, password)
    } catch (error: any) {
      ux.error(`Login failed${error.message ? ` with: ${error.message}` : ''}.`, {exit: 1})
    }
  }

  async dockerLogin(registry: string, password: string) {
    const [major, minor] = await new DockerHelper().version()

    if (major > 17 || (major === 17 && minor >= 7)) {
      return this.dockerLoginStdin(registry, password)
    }

    return this.dockerLoginArgv(registry, password)
  }

  dockerLoginStdin(registry: string, password: string) {
    const args = [
      'login',
      '--username=_',
      '--password-stdin',
      registry,
    ]
    return this.dockerHelper.cmd('docker', args, {input: password})
  }

  dockerLoginArgv(registry: string, password: string) {
    const args = [
      'login',
      '--username=_',
      `--password=${password}`,
      registry,
    ]
    return this.dockerHelper.cmd('docker', args)
  }
}
*/
