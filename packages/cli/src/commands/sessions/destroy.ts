import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import {OAuthSession} from '../../lib/sessions/sessions'

export default class SessionsDestroy extends Command {
  static description = 'delete (logout) OAuth session by ID'

  static args = {
    id: Args.string({required: true, description: 'ID of the OAuth session'}),
  }

  async run() {
    const {args: {id}} = await this.parse(SessionsDestroy)

    ux.action.start(`Destroying ${color.cyan(id)}`)

    await this.heroku.delete<OAuthSession>(
      `/oauth/sessions/${encodeURIComponent(id)}`,
    )

    ux.action.stop()
  }
}
