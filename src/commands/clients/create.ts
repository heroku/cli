import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import * as hux from '@heroku/heroku-cli-util/hux'
import {Args, ux} from '@oclif/core'

import {validateURL} from '../../lib/clients/clients.js'

export default class ClientsCreate extends Command {
  static args = {
    name: Args.string({description: 'name of the OAuth client', required: true}),
    redirect_uri: Args.string({description: 'redirect URL of the OAuth client', required: true}),
  }

  static description = 'create a new OAuth client'

  static examples = [
    color.command('heroku clients:create "Amazing" https://amazing-client.herokuapp.com/auth/heroku/callback'),
  ]

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    shell: flags.boolean({char: 's', description: 'output in shell format'}),
  }

  async run() {
    const {args, flags} = await this.parse(ClientsCreate)

    const {name, redirect_uri} = args
    validateURL(redirect_uri)

    ux.action.start(`Creating ${name}`)

    const {body: client} = await this.heroku.post<Heroku.OAuthClient>('/oauth/clients', {
      body: {name, redirect_uri},
    })

    ux.action.stop()

    if (flags.json) {
      hux.styledJSON(client)
    } else {
      ux.stdout(`${color.label('HEROKU_OAUTH_ID')}=${color.name(client.id!)}`)
      ux.stdout(`${color.label('HEROKU_OAUTH_SECRET')}=${color.info(client.secret!)}`)
    }
  }
}
