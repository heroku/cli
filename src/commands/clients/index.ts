import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

export default class ClientsIndex extends Command {
  static description = 'list your OAuth clients'
  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format', name: 'json'}),
  }

  async run() {
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(ClientsIndex)

    const clients = await platform.oauthClient.list()

    if (flags.json) {
      const sortedClients = clients.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      this.logJson(sortedClients)
    } else if (clients.length === 0) {
      ux.stdout('No OAuth clients.')
    } else {
      /* eslint-disable perfectionist/sort-objects */
      this.log(hux.table(clients, {
        name: {get: (w: any) => color.name(w.name)},
        id: {},
        redirect_uri: {},
      }, {
        sort: 'name',
      }))
      /* eslint-enable perfectionist/sort-objects */
    }
  }
}
