import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'

import {display} from '../../lib/authorizations'

export default class AuthorizationsRotate extends Command {
  static description = 'updates an OAuth authorization token'

  static args = [{name: 'id', required: true}]

  async run() {
    const {args} = await this.parse(AuthorizationsRotate)

    CliUx.ux.action.start('Rotating OAuth Authorization')

    const {body: authorization} = await this.heroku.post<Heroku.OAuthAuthorization>(
      `/oauth/authorizations/${encodeURIComponent(args.id)}/actions/regenerate-tokens`,
    )

    CliUx.ux.action.stop()

    display(authorization)
  }
}
