import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {add, list} from '../../lib/accounts/accounts'

export default class Add extends Command {
  static args = {
    name: Args.string({description: 'name of account to add', required: true}),
  }

  async run() {
    const {args} = await this.parse(Add)
    const {name} = args
    const logInMessage = 'You need to be logged in to run this command'
    let account: Heroku.Account
    let email = ''

    if (list().find(a => a.name === name)) {
      ux.error(`${name} already exists`)
    }

    try {
      account = await this.heroku.get<Heroku.Account>('/account', {retryAuth: false})
      email = account.body.email || ''
    } catch (error: any) {
      if (error.statusCode === 401) ux.error(logInMessage)
      throw error
    }

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
