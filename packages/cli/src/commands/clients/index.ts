import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'

export default class ClientsIndex extends Command {
  static description = 'list your OAuth clients'

  static flags = {
    json: flags.boolean({char: 'j', name: 'json', description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(ClientsIndex)

    const {body: clients} = await this.heroku.get<Array<Heroku.OAuthClient>>('/oauth/clients')

    if (flags.json) {
      const sortedClients = clients.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      hux.styledJSON(sortedClients)
    } else if (clients.length === 0) {
      ux.stdout('No OAuth clients.')
    } else {
      hux.table(clients, {
        name: {get: (w: any) => color.green(w.name)},
        id: {},
        redirect_uri: {},
      }, {
        sort: {name: 'asc'},
      })
    }
  }
}
