import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'

export default class ClientsInfo extends Command {
  static description = 'show details of an oauth client'

  static examples = [
    '$ heroku clients:info 36120128-fee7-455e-8b7f-807aee130946',
  ]

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    shell: flags.boolean({char: 's', description: 'output in shell format'}),
  }

  static args = [{name: 'id', required: true}]

  async run() {
    const {args, flags} = await this.parse(ClientsInfo)

    const {body: client} = await this.heroku.get<Heroku.OAuthClient>(`/oauth/clients/${args.id}`)

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
