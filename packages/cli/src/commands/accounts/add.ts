import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {add, list} from '../../lib/accounts/accounts'

export default class Add extends Command {
  static description = 'add a Heroku account to your cache'

  static args = {
    name: Args.string({description: 'name of Heroku account to add', required: true}),
  }

  static example = 'heroku accounts:add my-account'

  async run() {
    const {args} = await this.parse(Add)
    const {name} = args
    const logInMessage = 'You must be logged in to run this command.'

    if (list().some(a => a.name === name)) {
      ux.error(`${name} already exists`)
    }

    const {body: account} = await this.heroku.get<Heroku.Account>('/account')
    const email = account.email || ''

    const token = this.heroku.auth || ''

    if (token === '') {
      ux.error(logInMessage)
    }

    if (email === '') {
      ux.error(logInMessage)
    }

    add(name, email, token)
  }
}
