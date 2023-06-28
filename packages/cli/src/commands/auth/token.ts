import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Interfaces} from '@oclif/core'
import * as formatRelative from 'date-fns/formatRelative'

export default class AuthToken extends Command {
  static description = `outputs current CLI authentication token.
By default, the CLI auth token is only valid for 1 year. To generate a long-lived token, use heroku authorizations:create`

  static flags: Interfaces.FlagInput = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    this.parse(AuthToken)
    if (!this.heroku.auth) this.error('not logged in')
    try {
      const {body: tokens} = await this.heroku.get<Heroku.OAuthAuthorization>('/oauth/authorizations', {retryAuth: false})
      const token = tokens.find((t: any) => t.access_token && t.access_token.token === this.heroku.auth)
      if (token && token.access_token.expires_in) {
        const d = new Date()
        d.setSeconds(d.getSeconds() + token.access_token.expires_in)
        this.warn(`token will expire ${formatRelative(d, new Date())}\nUse ${color.cmd('heroku authorizations:create')} to generate a long-term token`)
      }
    } catch (error: any) {
      this.warn(error)
    }

    this.log(this.heroku.auth)
  }
}
