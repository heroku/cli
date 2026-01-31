import {color} from '@heroku/heroku-cli-util'
import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core'

export default class Auth2faGenerate extends Command {
  static aliases = [
    'twofactor:disable',
    '2fa:disable',
  ]

  static description = 'disables 2fa on account'

  static example = `${color.command('heroku auth:2fa:disable')}`

  async run() {
    ux.error('this command has been removed, in favor of disabling MFA in your Account Settings in a browser: https://dashboard.heroku.com/account')
  }
}
