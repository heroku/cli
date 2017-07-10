// @flow

import {Command} from 'cli-engine-heroku'

export default class Index extends Command {
  static topic = 'auth'
  static command = '2fa'
  static description = 'check 2fa status'
  static aliases = ['2fa', 'twofactor']

  async run () {
    let account = await this.heroku.get('/account')
    if (account.two_factor_authentication) {
      this.out.log('Two-factor authentication is enabled')
    } else {
      this.out.log('Two-factor authentication is not enabled')
    }
  }
}
