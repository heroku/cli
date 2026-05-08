import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

import AccountsModule from '../../lib/accounts/accounts.js'

export default class Add extends Command {
  static args = {
    name: Args.string({description: 'name of Heroku account to add', required: true}),
  }

  static description = 'add a Heroku account to your cache'

  static example = `${color.command('heroku accounts:add my-account')}`

  async run() {
    const {args} = await this.parse(Add)
    const {name} = args
    const accounts = await AccountsModule.list()

    if (accounts.some(account => account.name === name)) {
      ux.error(`${name} already exists`)
    }

    const {body: account} = await this.heroku.get<Heroku.Account>('/account')
    const email = account.email!

    const token = this.heroku.auth!

    if (accounts.some(account => account.username === email)) {
      ux.error(`${email} already exists`)
    }

    AccountsModule.add(name, email, token)
  }
}
