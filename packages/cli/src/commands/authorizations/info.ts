/*
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'

import {display} from '../../lib/authorizations/authorizations'

export default class AuthorizationsInfo extends Command {
  static description = 'show an existing OAuth authorization'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  static args = {
    id: Args.string({required: true, description: 'ID of the authorization'}),
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
*/
