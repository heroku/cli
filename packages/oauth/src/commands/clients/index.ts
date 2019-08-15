import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'
const sortBy = require('lodash.sortby')

export default class ClientsIndex extends Command {
  static description = 'list your OAuth clients'

  static flags = {
    json: flags.boolean({char: 'j', name: 'json', description: 'output in json format'}),
  }

  async run() {
    const {flags} = this.parse(ClientsIndex)

    let {body: clients} = await this.heroku.get<Array<Heroku.OAuthClient>>('/oauth/clients')

    clients = sortBy(clients, 'name')

    if (flags.json) {
      cli.styledJSON(clients)
    } else if (clients.length === 0) {
      cli.log('No OAuth clients.')
    } else {
      cli.table(clients, {
        name: {get: (w: any) => color.green(w.name)},
        id: {},
        redirect_uri: {},
      }, {'no-header': true})
    }
  }
}
