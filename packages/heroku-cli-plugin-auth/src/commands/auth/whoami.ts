import {Command} from '@heroku-cli/command'

export default class AuthWhoami extends Command {
  static topic = 'auth'
  static command = 'whoami'
  static description = 'display the current logged in user'
  static aliases = ['whoami']

  async run() {
    if (process.env.HEROKU_API_KEY) this.warn('HEROKU_API_KEY is set')
    if (!this.heroku.auth) this.notloggedin()
    try {
      let {body: account} = await this.heroku.get('/account', {retryAuth: false})
      this.log(account.email)
    } catch (err) {
      if (err.statusCode === 401) this.notloggedin()
      throw err
    }
  }

  notloggedin() {
    this.error('not logged in', {exit: 100})
  }
}
