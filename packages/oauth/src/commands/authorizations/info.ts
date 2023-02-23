import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'

import {display} from '../../lib/authorizations'

export default class AuthorizationsInfo extends Command {
  static description = 'show an existing OAuth authorization'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  static args = [{name: 'id', required: true}]

  async run() {
    const {args, flags} = await this.parse(AuthorizationsInfo)

    const {body: authentication} = await this.heroku.get<Heroku.OAuthClient>(
      `/oauth/authorizations/${args.id}`,
    )

    if (flags.json) {
      CliUx.ux.styledJSON(authentication)
    } else {
      display(authentication)
    }
  }
}
