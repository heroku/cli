import type {Account} from '@heroku/types/3.sdk'

import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

export default class TwoFactor extends Command {
  static aliases = ['2fa', 'twofactor']
  static description = 'check 2fa status'

  async run(): Promise<Account> {
    const {platform} = new HerokuSDK()
    const account = await platform.account.info()
    if (account.two_factor_authentication) {
      ux.stdout(`Two-factor authentication is ${color.success('enabled')}`)
    } else {
      ux.stdout(`Two-factor authentication is ${color.failure('not enabled')}`)
    }

    return account
  }
}
