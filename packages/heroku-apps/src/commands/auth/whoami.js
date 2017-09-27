// @flow

import {Command} from 'cli-engine-heroku'

export default class Whoami extends Command {
  static topic = 'auth'
  static command = 'whoami'
  static description = 'display the current logged in user'
  static aliases = ['whoami']

  async run () {
    if (process.env.HEROKU_API_KEY) this.out.warn('HEROKU_API_KEY is set')
    // flow$ignore
    if (!this.heroku.defaultOptions.headers.authorization) this.notloggedin()
    try {
      let {body: account} = await this.heroku.get('/account')
      this.out.log(account.email)
    } catch (err) {
      if (err.statusCode === 401) this.notloggedin()
      throw err
    }
  }

  notloggedin () {
    this.out.error('not logged in', {exitCode: 100})
  }
}
