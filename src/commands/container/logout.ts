import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core/ux'

import {debug} from '../../lib/container/debug.js'
import {DockerHelper} from '../../lib/container/docker-helper.js'

export default class Logout extends Command {
  static description = 'log out from Heroku Container Registry'
  static flags = {
    verbose: flags.boolean({char: 'v'}),
  }
  static topic = 'container'
  dockerHelper = new DockerHelper()

  dockerLogout(registry: string) {
    const args = [
      'logout',
      registry,
    ]

    return this.dockerHelper.cmd('docker', args)
  }

  async run() {
    const {flags} = await this.parse(Logout)
    const {verbose} = flags
    const herokuHost = process.env.HEROKU_HOST || 'heroku.com'
    const registry = `registry.${herokuHost}`

    if (verbose) {
      debug.enabled = true
    }

    try {
      await this.dockerLogout(registry)
    } catch (error) {
      const {message} = error as {message: string}
      ux.error(`Error: docker logout exited${message ? ` with: ${message}` : ''}.`)
    }
  }
}
