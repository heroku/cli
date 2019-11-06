import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import {OAuthSession} from '../../lib/sessions'

export default class SessionsDestroy extends Command {
  static description = 'delete (logout) OAuth session by ID'

  static args = [{name: 'id', required: true}]

  async run() {
    const {args: {id}} = this.parse(SessionsDestroy)

    cli.action.start(`Destroying ${color.cyan(id)}`)

    await this.heroku.delete<OAuthSession>(
      `/oauth/sessions/${encodeURIComponent(id)}`
    )

    cli.action.stop()
  }
}
