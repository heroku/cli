import {Command, flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'
import cli from 'cli-ux'
import * as _ from 'lodash'

export default class AuthorizationsIndex extends Command {
  static description = 'list OAuth authorizations'

  static flags = {
    help: flags.help({char: 'h'}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  async run() {
    const {args, flags} = this.parse(AuthorizationsIndex)

    const response = await this.heroku.get('/oauth/authorizations') as any
    const authorizations = _.sortBy(response.body, 'description')

    if (flags.json) {
      cli.styledJSON(authorizations)
    } else if (authorizations.length === 0) {
      cli.log('No OAuth authorizations.')
    } else {
      cli.table(authorizations, {
        printHeader: undefined,
        columns: [
          {key: 'description', format: v => color.green(v)},
          {key: 'id'},
          {key: 'scope', format: (v: any) => v.join(',')}
        ]
      })
    }
  }
}
