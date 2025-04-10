import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {current, list} from '../../lib/accounts/accounts'

export default class AccountsIndex extends Command {
  async run() {
    const accounts = list()
    if (accounts.length === 0) {
      ux.error('No accounts')
    }

    for (const account of accounts) {
      if (account.name === current()) {
        ux.log(`* ${account.name}`)
      } else {
        ux.log(`  ${account.name}`)
      }
    }
  }
}
