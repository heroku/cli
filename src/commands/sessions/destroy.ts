import {color} from '@heroku/heroku-cli-util'
import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import {OAuthSession} from '../../lib/sessions/sessions.js'

export default class SessionsDestroy extends Command {
  static args = {
    id: Args.string({description: 'ID of the OAuth session', required: true}),
  }

  static description = 'delete (logout) OAuth session by ID'

  async run() {
    const {args: {id}} = await this.parse(SessionsDestroy)

    ux.action.start(`Destroying ${color.name(id)}`)

    await this.heroku.delete<OAuthSession>(
      `/oauth/sessions/${encodeURIComponent(id)}`,
    )

    ux.action.stop()
  }
}

