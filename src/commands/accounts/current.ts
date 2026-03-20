import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import * as hux from '@heroku/heroku-cli-util/hux'
import {ux} from '@oclif/core'

import AccountsModule from '../../lib/accounts/accounts.js'

export default class Current extends Command {
  static baseFlags = Command.baseFlagsWithoutPrompt()
  static description = 'display the current Heroku account'
  static example = `${color.command('heroku accounts:current')}`
  static promptFlagActive = false

  async run() {
    const accountName = await AccountsModule.current()
    if (accountName) {
      hux.styledHeader(`Current account is ${color.user(accountName)}`)
    } else {
      ux.error(`You haven't set an account. Run ${color.code('heroku accounts:add <account-name>')} to add an account to your cache or ${color.code('heroku accounts:set <account-name>')} to set the current account.`)
    }
  }
}
