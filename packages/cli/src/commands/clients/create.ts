import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {validateURL} from '../../lib/clients/clients'

export default class ClientsCreate extends Command {
  static description = 'create a new OAuth client'

  static examples = [
    '$ heroku clients:create "Amazing" https://amazing-client.herokuapp.com/auth/heroku/callback',
  ]

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    shell: flags.boolean({char: 's', description: 'output in shell format'}),
  }

  static args = {
    name: Args.string({required: true, description: 'The name of the client to create.'}),
    redirect_uri: Args.string({required: true, description: 'The redirect_uri of the client to create.'}),
  }

  async run() {
    const {args, flags} = await this.parse(ClientsCreate)

    const {redirect_uri, name} = args
    validateURL(redirect_uri)

    ux.action.start(`Creating ${name}`)

    const {body: client} = await this.heroku.post<Heroku.OAuthClient>('/oauth/clients', {
      body: {name, redirect_uri},
    })

    ux.action.stop()

    if (flags.json) {
      ux.styledJSON(client)
    } else {
      ux.log(`HEROKU_OAUTH_ID=${client.id}`)
      ux.log(`HEROKU_OAUTH_SECRET=${client.secret}`)
    }
  }
}
