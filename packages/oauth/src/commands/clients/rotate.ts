import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'

export default class ClientsRotate extends Command {
  static description = 'rotate OAuth client secret'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    shell: flags.boolean({char: 's', description: 'output in shell format'}),
  }

  static args = [{name: 'id', required: true}]

  async run() {
    const {args, flags} = await this.parse(ClientsRotate)

    CliUx.ux.action.start(`Updating ${color.cyan(args.id)}`)

    const {body: client} = await this.heroku.post<Heroku.OAuthClient>(
      `/oauth/clients/${encodeURIComponent(args.id)}/actions/rotate-credentials`,
    )

    CliUx.ux.action.stop()

    if (flags.json) {
      CliUx.ux.styledJSON(client)
    } else if (flags.shell) {
      CliUx.ux.log(`HEROKU_OAUTH_ID=${client.id}`)
      CliUx.ux.log(`HEROKU_OAUTH_SECRET=${client.secret}`)
    } else {
      CliUx.ux.styledHeader(`${client.name}`)
      CliUx.ux.styledObject(client)
    }
  }
}
