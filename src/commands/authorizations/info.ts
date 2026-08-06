import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
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
    const {platform} = new HerokuSDK()
    const {args, flags} = await this.parse(AuthorizationsInfo)

    const authentication = await platform.oauthAuthorization.info(args.id)

    if (flags.json) {
      hux.styledJSON(authentication)
    } else {
      display(authentication)
    }
  }
}
