import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

export default class AuthorizationsRevoke extends Command {
  static aliases = ['authorizations:destroy']
  static args = {
    id: Args.string({description: 'ID of the authorization', required: true}),
  }
  static description = 'revoke OAuth authorization'
  static examples = [
    color.command('heroku authorizations:revoke 105a7bfa-34c3-476e-873a-b1ac3fdc12fb'),
  ]

  async run() {
    const {platform} = new HerokuSDK()
    const {args} = await this.parse(AuthorizationsRevoke)

    ux.action.start('Revoking OAuth Authorization')
    const auth = await platform.oauthAuthorization.delete(args.id)
    ux.action.stop(`done, revoked authorization from ${color.cyan(auth.description)}`)
  }
}
