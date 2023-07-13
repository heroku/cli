import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
const {sortBy} = require('lodash')

export default class AuthorizationsIndex extends Command {
  static description = 'list OAuth authorizations'

  static examples = [
    '$ heroku authorizations',
  ]

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(AuthorizationsIndex)

    let {body: authorizations} = await this.heroku.get<Array<Heroku.OAuthAuthorization>>('/oauth/authorizations')

    authorizations = sortBy(authorizations, 'description')

    if (flags.json) {
      ux.styledJSON(authorizations)
    } else if (authorizations.length === 0) {
      ux.log('No OAuth authorizations.')
    } else {
      const printLine: typeof this.log = (...args) => this.log(...args)
      ux.table(authorizations, {
        description: {get: (v: any) => color.green(v.description)},
        id: {},
        scope: {get: (v: any) => v.scope.join(',')},
      }, {'no-header': true, printLine})
    }
  }
}
