import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

export default class AuthorizationsIndex extends Command {
  static description = 'list OAuth authorizations'
  static examples = [
    color.command('heroku authorizations'),
  ]
  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  async run() {
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(AuthorizationsIndex)

    const authorizations = await platform.oauthAuthorization.list()

    if (flags.json) {
      hux.styledJSON(authorizations.sort((a, b) => a.description.localeCompare(b.description)))
    } else if (authorizations.length === 0) {
      ux.stdout('No OAuth authorizations.')
    } else {
      hux.table(authorizations, {
        Description: {get: (v: any) => color.name(v.description)},
        ID: {get: (v: any) => v.id},
        Scope: {get: (v: any) => v.scope.join(',')},
      }, {sort: 'Description'})
    }
  }
}
