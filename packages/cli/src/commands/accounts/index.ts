import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import accountsWrapper from '../../lib/accounts/accounts-wrapper.js'

export default class AccountsIndex extends Command {
  static description = 'list the Heroku accounts in your cache'

  static example = 'heroku accounts'

  async run() {
    const accounts = accountsWrapper.list()
    if (accounts.length === 0) {
      ux.error('You don\'t have any accounts in your cache.')
    }

    for (const account of accounts) {
      if (account.name === await accountsWrapper.current()) {
        ux.stdout(`* ${account.name}`)
      } else {
        ux.stdout(`  ${account.name}`)
      }
    }
  }
}
