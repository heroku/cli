import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import {display} from '../../lib/authorizations/authorizations.js'
import {createSDK} from '../../lib/sdk.js'

export default class AuthorizationsRotate extends Command {
  static args = {
    id: Args.string({description: 'ID of the authorization', required: true}),
  }
  static description = 'updates an OAuth authorization token'

  async run() {
    const {platform} = createSDK(this.heroku)
    const {args} = await this.parse(AuthorizationsRotate)

    ux.action.start('Rotating OAuth Authorization')
    const authorization = await platform.oauthAuthorization.regenerate(args.id)
    ux.action.stop()

    display(authorization)
  }
}
