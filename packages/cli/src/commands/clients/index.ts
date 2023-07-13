import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
const {sortBy} = require('lodash')

export default class ClientsIndex extends Command {
  static description = 'list your OAuth clients'

  static flags = {
    json: flags.boolean({char: 'j', name: 'json', description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(ClientsIndex)

    let {body: clients} = await this.heroku.get<Array<Heroku.OAuthClient>>('/oauth/clients')

    clients = sortBy(clients, 'name')

    if (flags.json) {
      ux.styledJSON(clients)
    } else if (clients.length === 0) {
      ux.log('No OAuth clients.')
    } else {
      const printLine: typeof this.log = (...args) => this.log(...args)
      ux.table(clients, {
        name: {get: (w: any) => color.green(w.name)},
        id: {},
        redirect_uri: {},
      }, {'no-header': true, printLine})
    }
  }
}
