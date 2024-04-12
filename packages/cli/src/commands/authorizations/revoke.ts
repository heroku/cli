import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

export default class AuthorizationsRevoke extends Command {
  static description = 'revoke OAuth authorization'

  static aliases = ['authorizations:revoke', 'authorizations:destroy']

  static examples = [
    '$ heroku authorizations:revoke 105a7bfa-34c3-476e-873a-b1ac3fdc12fb',
  ]

  static args = {
    id: Args.string({required: true}),
  }

  async run() {
    const {args} = await this.parse(AuthorizationsRevoke)

    ux.action.start('Revoking OAuth Authorization')

    const {body: auth, headers} = await this.heroku.delete<Heroku.OAuthAuthorization>(
      `/oauth/authorizations/${encodeURIComponent(args.id)}`,
    )

    const apiWarnings = headers['warning-message'] as string || ''

    if (apiWarnings) {
      ux.warn(apiWarnings)
    }

    ux.action.stop(`done, revoked authorization from ${color.cyan(auth.description)}`)
  }
}
