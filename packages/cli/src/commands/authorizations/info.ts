import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {display} from '../../lib/authorizations/authorizations'

export default class AuthorizationsInfo extends Command {
  static description = 'show an existing OAuth authorization'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  static args = {
    id: Args.string({required: true}),
  }

  async run() {
    const {args, flags} = await this.parse(AuthorizationsInfo)

    const {body: authentication} = await this.heroku.get<Heroku.OAuthClient>(
      `/oauth/authorizations/${args.id}`,
    )

    if (flags.json) {
      ux.styledJSON(authentication)
    } else {
      display(authentication)
    }
  }
}
