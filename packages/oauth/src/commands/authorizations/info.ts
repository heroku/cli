import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'

import {display} from '../../lib/authorizations'

export default class AuthorizationsInfo extends Command {
  static description = 'show an existing OAuth authorization'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  static args = [{name: 'id', required: true}]

  async run() {
    const {args, flags} = this.parse(AuthorizationsInfo)

    let {body: authentication} = await this.heroku.get<Heroku.OAuthClient>(
      `/oauth/authorizations/${args.id}`
    )

    if (flags.json) {
      cli.styledJSON(authentication)
    } else {
      display(authentication)
    }
  }
}
