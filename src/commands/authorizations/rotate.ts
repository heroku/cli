import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {display} from '../../lib/authorizations/authorizations.js'

export default class AuthorizationsRotate extends Command {
  static args = {
    id: Args.string({description: 'ID of the authorization', required: true}),
  }
  static description = 'updates an OAuth authorization token'

  async run() {
    const {args} = await this.parse(AuthorizationsRotate)

    ux.action.start('Rotating OAuth Authorization')
    const {body: authorization} = await this.heroku.post<Heroku.OAuthAuthorization>(`/oauth/authorizations/${encodeURIComponent(args.id)}/actions/regenerate-tokens`)
    ux.action.stop()

    display(authorization)
  }
}
