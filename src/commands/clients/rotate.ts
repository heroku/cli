import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

export default class ClientsRotate extends Command {
  static args = {
    id: Args.string({description: 'ID of the OAuth client', required: true}),
  }

  static description = 'rotate OAuth client secret'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    shell: flags.boolean({char: 's', description: 'output in shell format'}),
  }

  async run() {
    const {args, flags} = await this.parse(ClientsRotate)

    ux.action.start(`Updating ${color.name(args.id)}`)

    const {body: client} = await this.heroku.post<Heroku.OAuthClient>(
      `/oauth/clients/${encodeURIComponent(args.id)}/actions/rotate-credentials`,
    )

    ux.action.stop()

    if (flags.json) {
      hux.styledJSON(client)
    } else if (flags.shell) {
      ux.stdout(`HEROKU_OAUTH_ID=${client.id}`)
      ux.stdout(`HEROKU_OAUTH_SECRET=${client.secret}`)
    } else {
      hux.styledHeader(`${client.name}`)
      hux.styledObject(client)
    }
  }
}
