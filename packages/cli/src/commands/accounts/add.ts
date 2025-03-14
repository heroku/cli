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
    let account: Heroku.Account
    let email = ''

    if (list().find(a => a.name === name)) {
      ux.error(`${name} already exists`)
    }

    const token = this.heroku.auth || ''

    try {
      account = await this.heroku.get<Heroku.Account>('/account', {retryAuth: false})
      email = account.email || ''
    } catch (error) {
      const {message} = error as {message: string}
      ux.error(message)
    }

    if (token === '' || email === '') {
      ux.error('You need to be logged in to run this command.')
    }

    add(name, email, token)
  }
}
