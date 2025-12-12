import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import AccountsModule from '../../lib/accounts/accounts.js'
import {color} from '@heroku-cli/color'

export default class Current extends Command {
  static description = 'display the current Heroku account'

  static example = 'heroku accounts:current'

  async run() {
    const accountName = await AccountsModule.current()
    if (accountName) {
      hux.styledHeader(`Current account is ${accountName}`)
    } else {
      ux.error(`You haven't set an account. Run ${color.cmd('heroku accounts:add <account-name>')} to add an account to your cache or ${color.cmd('heroku accounts:set <account-name>')} to set the current account.`)
    }
  }
}
