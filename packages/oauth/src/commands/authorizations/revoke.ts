import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'

export default class AuthorizationsRevoke extends Command {
  static description = 'revoke OAuth authorization'

  static examples = [
    '$ heroku authorizations:revoke 105a7bfa-34c3-476e-873a-b1ac3fdc12fb',
  ]

  static args = [{name: 'id', required: true}]

  async run() {
    const {args} = this.parse(AuthorizationsRevoke)

    cli.action.start('Revoking OAuth Authorization')

    const {body: auth} = await this.heroku.delete<Heroku.OAuthAuthorization>(
      `/oauth/authorizations/${encodeURIComponent(args.id)}`,
    )

    cli.action.stop(`done, revoked authorization from ${color.cyan(auth.description)}`)
  }
}
