import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

import {createSDK} from '../../lib/sdk.js'

export default class ClientsDestroy extends Command {
  static args = {
    id: Args.string({description: 'ID of the OAuth client', required: true}),
  }
  static description = 'delete client by ID'

  async run() {
    const {platform} = createSDK(this.heroku)
    const {args} = await this.parse(ClientsDestroy)

    ux.action.start(`Destroying ${color.name(args.id)}`)

    await platform.oauthClient.delete(args.id)

    ux.action.stop()
  }
}
