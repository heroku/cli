import type {Account} from '@heroku/types/3.sdk'

import {Command} from '@heroku-cli/command'
import {accountExtensions, formatDelinquencyWarning} from '@heroku/sdk/extensions/platform'

import {createSDK} from '../../lib/sdk.js'

export default class AuthWhoami extends Command {
  static aliases = ['whoami']
  static baseFlags = Command.baseFlagsWithoutPrompt()
  static description = 'display the current logged in user'
  static promptFlagActive = false

  notloggedin() {
    this.error('not logged in', {exit: 100})
  }

  async run(): Promise<Account> {
    const {platform} = createSDK(this.heroku, {extensions: [accountExtensions]})

    if (process.env.HEROKU_API_KEY) this.warn('HEROKU_API_KEY is set')
    if (!this.heroku.auth) this.notloggedin()
    try {
      const {account, delinquency} = await platform.account.getWithDelinquency()
      const delinquencyWarning = formatDelinquencyWarning('account', delinquency)
      if (delinquencyWarning) this.warn(delinquencyWarning)
      this.log(account.email)
      return account
    } catch (error: unknown) {
      if ((error as {statusCode?: number}).statusCode === 401) this.notloggedin()
      throw error
    }
  }
}
