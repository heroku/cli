import { Command } from '@heroku-cli/command'
import cli from 'cli-ux'

export default class Whoami extends Command {
  static topic = 'auth'
  static command = 'whoami'
  static description = 'display the current logged in user'
  static aliases = ['whoami']

  async run() {
    if (process.env.HEROKU_API_KEY) cli.warn('HEROKU_API_KEY is set')
    if (!this.heroku.defaultOptions.headers!.authorization) this.notloggedin()
    try {
      let { body: account } = await this.heroku.get('/account')
      cli.log(account.email)
    } catch (err) {
      if (err.http.statusCode === 401) this.notloggedin()
      throw err
    }
  }

  notloggedin() {
    cli.error('not logged in', { exitCode: 100 })
  }
}
