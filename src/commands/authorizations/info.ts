import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'
import {Args} from '@oclif/core'

import {SDK_HEADER} from '../../lib/api.js'
import {display} from '../../lib/authorizations/authorizations.js'

export default class AuthorizationsInfo extends Command {
  static args = {
    id: Args.string({description: 'ID of the authorization', required: true}),
  }
  static description = 'show an existing OAuth authorization'
  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    team: flags.team({description: 'team to which the authorization belongs'}),
  }

  async run() {
    const {args, flags} = await this.parse(AuthorizationsInfo)

    const endpoint = flags.team
      ? `/teams/${encodeURIComponent(flags.team)}/oauth/authorizations/${args.id}`
      : `/oauth/authorizations/${args.id}`

    const {body: authentication} = await this.heroku.get<Heroku.OAuthAuthorization>(
      endpoint,
      flags.team ? {headers: {Accept: SDK_HEADER}} : {},
    )

    if (flags.json) {
      hux.styledJSON(authentication)
    } else {
      display(authentication)
    }
  }
}
