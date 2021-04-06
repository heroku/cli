import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

export default class Auth2faGenerate extends Command {
  static description = 'disables 2fa on account'
  static example = `$ heroku auth:2fa:disable`

  static aliases = [
    'twofactor:disable',
    '2fa:disable',
  ]

  async run() {
    cli.warn('DEPRECATION WARNING: this command has been removed, in favor of disabling MFA in your Account Settings in a browser.')
  }
}
