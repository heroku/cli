import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export default class ClientsIndex extends Command {
  static description = 'list your OAuth clients'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format', name: 'json'}),
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
      /* eslint-disable perfectionist/sort-objects */
      hux.table(clients, {
        name: {get: (w: any) => color.name(w.name)},
        id: {},
        redirect_uri: {},
      }, {
        sort: {name: 'asc'},
      })
      /* eslint-enable perfectionist/sort-objects */
    }
  }
}
