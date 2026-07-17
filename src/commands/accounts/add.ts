import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

import AccountsModule from '../../lib/accounts/accounts.js'

export default class Add extends Command {
  static args = {
    name: Args.string({description: 'alias for Heroku account to add', required: true}),
  }
  static description = 'add the current Heroku account to your accounts cache'
  static example = `${color.command('heroku accounts:add my-account')}`

  async run() {
    const {platform} = new HerokuSDK()
    const {args} = await this.parse(Add)
    const {name} = args
    const accounts = await AccountsModule.list()

    if (accounts.some(account => account.name === name)) {
      ux.error(`${name} already exists`)
    }

    const account = await platform.account.info()
    const email = account.email!

    const existingAlias = accounts.find(account => account.name && account.username === email)
    if (existingAlias) {
      ux.error(`Account ${email} already has an alias of ${existingAlias.name}.`)
    }

    const token = this.heroku.auth!
    const config = AccountsModule.getStorageConfig()

    if (config.credentialStore) {
      // Keychain-mode: don't save token to cache file
      AccountsModule.add(name, email)
    } else {
      // Netrc-mode: save token to cache file
      AccountsModule.add(name, email, token)
    }
  }
}
