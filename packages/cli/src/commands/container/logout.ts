import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as DockerHelper from '../../lib/container/docker_helper'
import {debug} from '../../lib/container/debug'

function dockerLogout(registry: string) {
  const args = [
    'logout',
    registry,
  ]

  return DockerHelper.cmd('docker', args)
}

export default class Logout extends Command {
  static topic = 'container'
  static description = 'log out from Heroku Container Registry'
  static flags = {
    verbose: flags.boolean({char: 'v'}),
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
      await dockerLogout(registry)
    } catch (error: any) {
      ux.error(`Error: docker logout exited${error.message ? ` with: ${error.message}` : ''}.`)
    }
  }
}
