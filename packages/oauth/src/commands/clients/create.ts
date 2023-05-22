import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'

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
    const {args, flags} = await this.parse(ClientsCreate)

    const {redirect_uri, name} = args
    validateURL(redirect_uri)

    CliUx.ux.action.start(`Creating ${name}`)

    const {body: client} = await this.heroku.post<Heroku.OAuthClient>('/oauth/clients', {
      body: {name, redirect_uri},
    })

    CliUx.ux.action.stop()

    if (flags.json) {
      CliUx.ux.styledJSON(client)
    } else {
      CliUx.ux.log(`HEROKU_OAUTH_ID=${client.id}`)
      CliUx.ux.log(`HEROKU_OAUTH_SECRET=${client.secret}`)
    }
  }
}
