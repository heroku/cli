import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import {CliUx} from '@oclif/core'

import {OAuthSession} from '../../lib/sessions'

export default class SessionsDestroy extends Command {
  static description = 'delete (logout) OAuth session by ID'

  static args = [{name: 'id', required: true}]

  async run() {
    const {args: {id}} = await this.parse(SessionsDestroy)

    CliUx.ux.action.start(`Destroying ${color.cyan(id)}`)

    await this.heroku.delete<OAuthSession>(
      `/oauth/sessions/${encodeURIComponent(id)}`,
    )

    CliUx.ux.action.stop()
  }
}
