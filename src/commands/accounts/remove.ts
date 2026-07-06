import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

import AccountsModule from '../../lib/accounts/accounts.js'

export default class Remove extends Command {
  static args = {
    name: Args.string({description: 'name of Heroku account to remove', required: true}),
  }
  static description = 'remove a Heroku account from your cache'
  static example = `${color.command('heroku accounts:remove my-account')}`

  async run() {
    const {args} = await this.parse(Remove)
    const {name} = args

    const accounts = await AccountsModule.list()
    const account = accounts.find(a => a.name === name || a.username === name)

    if (!account) {
      ux.error(`${name} doesn't exist in your accounts cache.`)
    }

    const currentAccount = await AccountsModule.current(this.heroku)
    // Check both alias (name) and email (username) against current account
    if (currentAccount === name || currentAccount === account.username) {
      ux.error(`${name} is the current account. To log out, run ${color.command('heroku logout')}.`)
    }

    await AccountsModule.remove(name)
  }
}
