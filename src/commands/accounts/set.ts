import {color} from '@heroku/heroku-cli-util'
import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import AccountsModule from '../../lib/accounts/accounts.js'

export default class Set extends Command {
  static args = {
    name: Args.string({description: 'name of account to set', required: true}),
  }

  static description = 'set the current Heroku account from your cache'

  static example = `${color.command('heroku accounts:set my-account')}`

  async run() {
    const {args} = await this.parse(Set)
    const {name} = args

    if (!AccountsModule.list().some(a => a.name === name)) {
      ux.error(`${name} does not exist in your accounts cache.`)
    }

    AccountsModule.set(name)
  }
}
