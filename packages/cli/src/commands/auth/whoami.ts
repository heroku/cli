import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

export default class AuthWhoami extends Command {
  static description = 'display the current logged in user'

  static aliases = ['whoami']

  async run() {
    if (process.env.HEROKU_API_KEY) this.warn('HEROKU_API_KEY is set')
    if (!this.heroku.auth) this.notloggedin()
    try {
      const {body: account} = await this.heroku.get<Heroku.Account>('/account', {retryAuth: false})
      this.log(account.email)
    } catch (error: any) {
      if (error.statusCode === 401) this.notloggedin()
      throw error
    }
  }

  notloggedin() {
    this.error('not logged in', {exit: 100})
  }
}
