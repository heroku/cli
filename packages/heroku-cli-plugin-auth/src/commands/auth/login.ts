import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'

export default class Login extends Command {
  static description = 'login with your Heroku credentials'
  static aliases = ['login']
  static flags = {
    browser: flags.string({description: 'browser to open SSO with'}),
    sso: flags.boolean({char: 's', description: 'login for enterprise users under SSO'}),
    interactive: flags.boolean({char: 'i', description: 'login with username/password'}),
    'expires-in': flags.integer({char: 'e', description: 'duration of token in seconds (default 1 year)'}),
  }

  async run() {
    const {flags} = await this.parse(Login)
    let method: 'sso' | 'interactive' | undefined
    if (flags.sso) method = 'sso'
    else if (flags.interactive) method = 'interactive'
    // TODO: handle browser
    await this.heroku.login({method, expiresIn: flags['expires-in']})
    const {body: account} = await this.heroku.get('/account', {retryAuth: false})
    this.log(`Logged in as ${color.green(account.email)}`)
  }
}
