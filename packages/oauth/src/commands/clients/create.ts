import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'

import {validateURL} from '../../lib/clients'

export default class ClientsCreate extends Command {
  static description = 'create a new OAuth client'

  static examples = [
    '$ heroku clients:create "Amazing" https://amazing-client.herokuapp.com/auth/heroku/callback',
  ]

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    shell: flags.boolean({char: 's', description: 'output in shell format'}),
  }

  static args = [
    {name: 'name', required: true},
    {name: 'redirect_uri', required: true},
  ]

  async run() {
    const {args, flags} = this.parse(ClientsCreate)

    const {redirect_uri, name} = args
    validateURL(redirect_uri)

    cli.action.start(`Creating ${args.name}`)

    const {body: client} = await this.heroku.post<Heroku.OAuthClient>('/oauth/clients', {
      body: {name, redirect_uri},
    })

    cli.action.stop()

    if (flags.json) {
      cli.styledJSON(client)
    } else {
      cli.log(`HEROKU_OAUTH_ID=${client.id}`)
      cli.log(`HEROKU_OAUTH_SECRET=${client.secret}`)
    }
  }
}
