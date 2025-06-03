import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import accountsModule from '../../lib/accounts/accounts.js'

export default class AccountsIndex extends Command {
  static description = 'list the Heroku accounts in your cache'

  static example = 'heroku accounts'

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
