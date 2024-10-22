import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

export default class ClientsDestroy extends Command {
  static description = 'delete client by ID'

  static args = {
    id: Args.string({required: true, description: 'ID of the OAuth client'}),
  }

  async run() {
    const {args} = await this.parse(ClientsDestroy)

    ux.action.start(`Destroying ${color.cyan(args.id)}`)

    await this.heroku.delete<Heroku.OAuthClient>(
      `/oauth/clients/${args.id}`,
    )

    ux.action.stop()
  }
}
