// @flow

import {Command} from '@heroku-cli/command'
import {cli} from 'cli-ux'

export default class Index extends Command {
  static topic = 'auth'
  static command = '2fa'
  static description = 'check 2fa status'
  static aliases = ['2fa', 'twofactor']

  async run () {
    let {body: account} = await this.heroku.get('/account')
    if (account.two_factor_authentication) {
      cli.log('Two-factor authentication is enabled')
    } else {
      cli.log('Two-factor authentication is not enabled')
    }
  }
}
