import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core/ux'

import {debug} from '../../lib/container/debug.js'
import {DockerHelper} from '../../lib/container/docker-helper.js'

export default class Login extends Command {
  static description = 'log in to Heroku Container Registry'
  static flags = {
    verbose: flags.boolean({char: 'v'}),
  }
  static topic = 'container'
  dockerHelper = new DockerHelper()

  async dockerLogin(registry: string, password: string) {
    const [major, minor] = await new DockerHelper().version()

    if (major > 17 || (major === 17 && minor >= 7)) {
      return this.dockerLoginStdin(registry, password)
    }

    return this.dockerLoginArgv(registry, password)
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

  dockerLoginStdin(registry: string, password: string) {
    const args = [
      'login',
      '--username=_',
      '--password-stdin',
      registry,
    ]
    return this.dockerHelper.cmd('docker', args, {input: password})
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
      await this.dockerLogin(registry, password)
    } catch (error: any) {
      ux.error(`Login failed${error.message ? ` with: ${error.message}` : ''}.`, {exit: 1})
    }
  }
}
