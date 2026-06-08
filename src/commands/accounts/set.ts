import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

import AccountsModule from '../../lib/accounts/accounts.js'

export default class Set extends Command {
  static args = {
    name: Args.string({description: 'name or username of account to set', required: true}),
  }
  static description = 'set the current Heroku account from your accounts cache or system keychain'
  static example = `${color.command('heroku accounts:set my-account')}`

  async run() {
    const {args} = await this.parse(Set)
    const {name} = args

    const accounts = await AccountsModule.list()
    const account = accounts.find(account => account.name === name || account.username === name)

    if (!account) {
      ux.error(`${name} doesn't exist in your accounts cache or system keychain.`)
    }

    await AccountsModule.set(account, this.config.dataDir)
  }
}
