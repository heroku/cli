import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'

export default class ClientsInfo extends Command {
  static description = 'show details of an oauth client'

  static examples = [
    '$ heroku clients:info 36120128-fee7-455e-8b7f-807aee130946'
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    shell: flags.boolean({char: 's', description: 'output in shell format'})
  }

  static args = [{name: 'id', required: true}]

  async run() {
    const {args, flags} = this.parse(ClientsInfo)

    let {body: client} = await this.heroku.get<Heroku.OAuthClient>(`/oauth/clients/${args.id}`)

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
