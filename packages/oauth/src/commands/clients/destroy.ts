import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'

export default class ClientsDestroy extends Command {
  static description = 'delete client by ID'

  static args = [{name: 'id', required: true}]

  async run() {
    const {args} = await this.parse(ClientsDestroy)

    CliUx.ux.action.start(`Destroying ${color.cyan(args.id)}`)

    await this.heroku.delete<Heroku.OAuthClient>(
      `/oauth/clients/${args.id}`,
    )

    CliUx.ux.action.stop()
  }
}
