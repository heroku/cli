import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'
import {Args} from '@oclif/core'

import {display} from '../../lib/authorizations/authorizations.js'

export default class AuthorizationsInfo extends Command {
  static args = {
    id: Args.string({description: 'ID of the authorization', required: true}),
  }

  static description = 'show an existing OAuth authorization'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  async run() {
    const {args, flags} = await this.parse(AuthorizationsInfo)

    const {body: authentication} = await this.heroku.get<Heroku.OAuthAuthorization>(
      `/oauth/authorizations/${args.id}`,
    )

    if (flags.json) {
      hux.styledJSON(authentication)
    } else {
      display(authentication)
    }
  }
}
