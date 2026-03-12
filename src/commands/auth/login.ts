import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

export default class Login extends Command {
  static aliases = ['login']

  static description = 'login with your Heroku credentials'

  static flags = {
    browser: flags.string({description: 'browser to open SSO with (example: "firefox", "safari")'}),
    'expires-in': flags.integer({char: 'e', description: 'duration of token in seconds (default 30 days)'}),
    interactive: flags.boolean({char: 'i', description: 'login with username/password'}),
    sso: flags.boolean({char: 's', description: 'login for enterprise users under SSO', hidden: true}),
  }

  async run() {
    const {flags} = await this.parse(Login)
    let method: 'interactive' | undefined
    if (flags.interactive) method = 'interactive'
    await this.heroku.login({browser: flags.browser, expiresIn: flags['expires-in'], method})
    const {body: account} = await this.heroku.get<Heroku.Account>('/account', {retryAuth: false})
    this.log(`Logged in as ${color.user(account.email!)}`)
    await this.config.runHook('recache', {type: 'login'})
  }
}

