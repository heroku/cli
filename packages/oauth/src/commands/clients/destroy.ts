import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'

export default class ClientsDestroy extends Command {
  static description = 'delete client by ID'

  static args = [{name: 'id', required: true}]

  async run() {
    const {args} = this.parse(ClientsDestroy)

    cli.action.start(`Destroying ${color.cyan(args.id)}`)

    await this.heroku.delete<Heroku.OAuthClient>(
      `/oauth/clients/${args.id}`,
    )

    cli.action.stop()
  }
}
