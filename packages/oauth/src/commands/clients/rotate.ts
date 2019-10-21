import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'

export default class ClientsRotate extends Command {
  static description = 'rotate OAuth client secret'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    shell: flags.boolean({char: 's', description: 'output in shell format'})
  }

  static args = [{name: 'id', required: true}]

  async run() {
    const {args, flags} = this.parse(ClientsRotate)

    cli.action.start(`Updating ${color.cyan(args.id)}`)

    let {body: client} = await this.heroku.post<Heroku.OAuthClient>(
      `/oauth/clients/${encodeURIComponent(args.id)}/actions/rotate-credentials`
    )

    cli.action.stop()

    if (flags.json) {
      cli.styledJSON(client)
    } else if (flags.shell) {
      cli.log(`HEROKU_OAUTH_ID=${client.id}`)
      cli.log(`HEROKU_OAUTH_SECRET=${client.secret}`)
    } else {
      cli.styledHeader(`${client.name}`)
      cli.styledObject(client)
    }
  }
}
