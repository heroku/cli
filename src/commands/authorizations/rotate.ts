import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {SDK_HEADER} from '../../lib/api.js'
import {display} from '../../lib/authorizations/authorizations.js'

export default class AuthorizationsRotate extends Command {
  static args = {
    id: Args.string({description: 'ID of the authorization', required: true}),
  }
  static description = 'updates an OAuth authorization token'
  static flags = {
    team: flags.team(),
  }

  async run() {
    const {args, flags} = await this.parse(AuthorizationsRotate)

    const endpoint = flags.team
      ? `/teams/${encodeURIComponent(flags.team)}/oauth/authorizations/${encodeURIComponent(args.id)}/actions/regenerate-tokens`
      : `/oauth/authorizations/${encodeURIComponent(args.id)}/actions/regenerate-tokens`

    ux.action.start('Rotating OAuth Authorization')
    const {body: authorization} = await this.heroku.post<Heroku.OAuthAuthorization>(
      endpoint,
      flags.team ? {headers: {Accept: SDK_HEADER}} : {},
    )
    ux.action.stop()

    display(authorization)
  }
}
