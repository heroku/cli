import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Interfaces} from '@oclif/core'

export default class Login extends Command {
  static description = 'login with your Heroku credentials'

  static aliases = ['login']

  static flags: Interfaces.FlagInput  = {
    browser: flags.string({description: 'browser to open SSO with (example: "firefox", "safari")'}),
    sso: flags.boolean({hidden: true, char: 's', description: 'login for enterprise users under SSO'}),
    interactive: flags.boolean({char: 'i', description: 'login with username/password'}),
    'expires-in': flags.integer({char: 'e', description: 'duration of token in seconds (default 30 days)'}),
  }

  async run() {
    const {flags} = await this.parse(Login)
    let method: 'interactive' | undefined
    if (flags.interactive) method = 'interactive'
    await this.heroku.login({method, expiresIn: flags['expires-in'], browser: flags.browser})
    const {body: account} = await this.heroku.get<Heroku.Account>('/account', {retryAuth: false})
    this.log(`Logged in as ${color.green(account.email!)}`)
    await this.config.runHook('recache', {type: 'login'})
  }
}
