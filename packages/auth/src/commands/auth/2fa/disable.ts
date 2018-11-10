import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import ux from 'cli-ux'

export default class Auth2faGenerate extends Command {
  static description = 'disables 2fa on account'

  static aliases = [
    'twofactor:disable',
    '2fa:disable',
  ]

  static example = `$ heroku auth:2fa:disable
Disabling 2fa on me@example.com... done`

  async run() {
    ux.action.start('Disabling 2fa')
    const {body: account} = await this.heroku.get<Heroku.Account>('/account')
    ux.action.start(`Disabling 2fa on ${account.email}`)
    if (!account.two_factor_authentication) this.error('2fa is already disabled')
    const password = await ux.prompt('Password', {type: 'hide'})
    await this.heroku.patch('/account', {body: {password, two_factor_authentication: false}})
  }
}
