import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

import {createSDK} from '../../lib/sdk.js'

export default class SessionsDestroy extends Command {
  static args = {
    id: Args.string({description: 'ID of the OAuth session', required: true}),
  }
  static description = 'delete (logout) OAuth session by ID'

  async run() {
    const {args: {id}} = await this.parse(SessionsDestroy)
    const {platform} = createSDK(this.heroku)

    ux.action.start(`Destroying ${color.name(id)}`)

    await platform.oauthSession.delete(id)

    ux.action.stop()
  }
}
