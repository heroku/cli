import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

export default class TwoFactor extends Command {
  static description = 'check 2fa status'

  static aliases = ['2fa', 'twofactor']

  async run() {
    const {body: account} = await this.heroku.get<Heroku.Account>('/account')
    if (account.two_factor_authentication) {
      this.log(`Two-factor authentication is ${color.bold('enabled')}`)
    } else {
      this.log(`Two-factor authentication is ${color.bold('not enabled')}`)
    }
  }
}
