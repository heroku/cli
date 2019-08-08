import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'

import {display} from '../../lib/authorizations'

export default class AuthorizationsRotate extends Command {
  static description = 'updates an OAuth authorization token'

  static args = [{name: 'id', required: true}]

  async run() {
    const {args} = this.parse(AuthorizationsRotate)

    cli.action.start('Rotating OAuth Authorization')

    let {body: authorization} = await this.heroku.post<Heroku.OAuthAuthorization>(
      `/oauth/authorizations/${encodeURIComponent(args.id)}/actions/regenerate-tokens`
    )

    display(authorization)

    cli.action.stop()
  }
}
