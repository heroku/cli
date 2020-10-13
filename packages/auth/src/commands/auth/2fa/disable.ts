import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

export default class Auth2faGenerate extends Command {
  static description = 'disables 2fa on account'

  static aliases = [
    'twofactor:disable',
    '2fa:disable',
  ]

  static example = `$ heroku auth:2fa:disable
Disabling 2fa on me@example.com... done`

  async run() {
    cli.action.start('Disabling 2fa')
    const headers = { 'Accept': 'application/vnd.heroku+json; version=3.with_vaas_info' }
    const {body: account} = await this.heroku.get<Heroku.Account>('/account', {headers})
    cli.action.start(`Disabling 2fa on ${account.email}`)
    if (account.vaas_enrolled) this.error('Cannot disable 2fa via CLI\nPlease visit your Account page on the Heroku Dashboad to manage 2fa')
    if (!account.two_factor_authentication) this.error('2fa is already disabled')
    const password = await cli.prompt('Password', {type: 'hide'})
    await this.heroku.patch('/account', {body: {password, two_factor_authentication: false}})
  }
}
