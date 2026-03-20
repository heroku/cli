import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core'

import accountsModule from '../../lib/accounts/accounts.js'

export default class AccountsIndex extends Command {
  static baseFlags = Command.baseFlagsWithoutPrompt()
  static description = 'list the Heroku accounts in your cache'
  static example = `${color.command('heroku accounts')}`
  static promptFlagActive = false

  async run() {
    const accounts = accountsModule.list()
    if (accounts.length === 0) {
      ux.error('You don\'t have any accounts in your cache.')
    }

    for (const account of accounts) {
      if (account.name === await accountsModule.current()) {
        ux.stdout(`* ${account.name}`)
      } else {
        ux.stdout(`  ${account.name}`)
      }
    }
  }
}
