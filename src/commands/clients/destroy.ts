import {color} from '@heroku/heroku-cli-util'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

export default class ClientsDestroy extends Command {
  static args = {
    id: Args.string({description: 'ID of the OAuth client', required: true}),
  }

  static description = 'delete client by ID'

  async run() {
    const {args} = await this.parse(ClientsDestroy)

    ux.action.start(`Destroying ${color.name(args.id)}`)

    await this.heroku.delete<Heroku.OAuthClient>(
      `/oauth/clients/${args.id}`,
    )

    ux.action.stop()
  }
}
