import type {Account} from '@heroku/types/3.sdk'

import {Command} from '@heroku-cli/command'
import {accountExtensions} from '@heroku/sdk/extensions/platform'

import {warnDelinquency} from '../../lib/delinquency.js'
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
    // Opt out of the default 401→re-login→retry: a stale/invalid token here must
    // report "not logged in" (the 401 branch below), not prompt for a new login.
    const {platform} = createSDK(this.heroku, {clientOptions: {reauthorize: undefined}, extensions: [accountExtensions]})

    if (process.env.HEROKU_API_KEY) this.warn('HEROKU_API_KEY is set')
    if (!this.heroku.auth) this.notloggedin()
    try {
      const {account, delinquency} = await platform.account.getWithDelinquency()
      warnDelinquency(this, 'account', delinquency)
      this.log(account.email)
      return account
    } catch (error: unknown) {
      if ((error as {statusCode?: number}).statusCode === 401) this.notloggedin()
      throw error
    }
  }
}
