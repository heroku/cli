import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

export default class TwoFactor extends Command {
  static aliases = ['2fa', 'twofactor']

  static description = 'check 2fa status'

  async run() {
    const {body: account} = await this.heroku.get<Heroku.Account>('/account')
    if (account.two_factor_authentication) {
      ux.stdout(`Two-factor authentication is ${color.success('enabled')}`)
    } else {
      ux.stdout(`Two-factor authentication is ${color.failure('not enabled')}`)
    }
  }
}
