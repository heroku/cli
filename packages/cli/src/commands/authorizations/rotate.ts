import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {display} from '../../lib/authorizations/authorizations'

export default class AuthorizationsRotate extends Command {
  static description = 'updates an OAuth authorization token'

  static args = {
    id: Args.string({required: true}),
  }

  async run() {
    const {args} = await this.parse(AuthorizationsRotate)

    ux.action.start('Rotating OAuth Authorization')

    const {body: authorization} = await this.heroku.post<Heroku.OAuthAuthorization>(
      `/oauth/authorizations/${encodeURIComponent(args.id)}/actions/regenerate-tokens`,
    )

    ux.action.stop()

    display(authorization)
  }
}
