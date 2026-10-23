import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {accountExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

import {warnDelinquency} from '../../../lib/delinquency.js'
import {createSDK} from '../../../lib/sdk.js'

export default class TwoFactor extends Command {
  static aliases = ['2fa', 'twofactor']
  static description = 'check 2fa status'

  async run(): Promise<boolean> {
    const {platform} = createSDK(this.heroku, {extensions: [accountExtensions]})
    const {account, delinquency} = await platform.account.getWithDelinquency()
    warnDelinquency(this, 'account', delinquency)
    if (account.two_factor_authentication) {
      ux.stdout(`Two-factor authentication is ${color.success('enabled')}`)
    } else {
      ux.stdout(`Two-factor authentication is ${color.failure('not enabled')}`)
    }

    return account.two_factor_authentication
  }
}
