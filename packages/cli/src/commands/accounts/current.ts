import {color, hux} from '@heroku/heroku-cli-util'
import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import AccountsModule from '../../lib/accounts/accounts.js'

export default class Current extends Command {
  static description = 'display the current Heroku account'

  static example = 'heroku accounts:current'

  async run() {
    const accountName = await AccountsModule.current()
    if (accountName) {
      hux.styledHeader(`Current account is ${accountName}`)
    } else {
      ux.error(`You haven't set an account. Run ${color.code('heroku accounts:add <account-name>')} to add an account to your cache or ${color.code('heroku accounts:set <account-name>')} to set the current account.`)
    }
  }
}
