import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {add, list} from '../../lib/accounts/accounts'
import {FlagInput} from '@oclif/core/lib/interfaces/parser'
import {hux} from '@heroku/heroku-cli-util'
import * as open from 'open'

export default class Add extends Command {
  static description = 'add a Heroku account to your cache (requires login)'

  static args = {
    name: Args.string({description: 'name of Heroku account to add', required: true}),
  }

  static flags: FlagInput  = {
    browser: flags.string({description: 'browser to open login with (example: "firefox", "safari")'}),
    sso: flags.boolean({char: 's', description: 'login for enterprise users under SSO'}),
    'expires-in': flags.integer({char: 'e', description: 'duration of login token in seconds (default 30 days)'}),
  }

  static example = 'heroku accounts:add my-account'

  async run() {
    const {args, flags} = await this.parse(Add)
    const {name} = args
    const {sso, browser, 'expires-in': expiresIn} = flags
    const logInMessage = 'You must be logged in to run this command.'
    const dashboardUrl = 'https://dashboard.heroku.com'
    let redirectToDashboard = false

    if (list().some(a => a.name === name)) {
      ux.error(`${name} already exists`)
    }

    if (!sso) {
      ux.warn('You may be signed into a different Heroku account from the browser.')
      redirectToDashboard = await hux.confirm('Redirect to Dashboard for sign out?')

      if (redirectToDashboard) {
        await open(dashboardUrl)
        ux.log('Sign out in the browser and run this command again.')
        ux.exit()
      }
    }

    await this.heroku.login({method: sso ? 'sso' : 'browser', expiresIn, browser})
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
