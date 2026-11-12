import type {OauthAuthorization} from '@heroku/types/3.sdk'

import {Command} from '@heroku-cli/command'
import {Args} from '@oclif/core'

import {format} from '../../lib/authorizations/authorizations.js'
import {createSDK} from '../../lib/sdk.js'

export default class AuthorizationsInfo extends Command {
  static args = {
    id: Args.string({description: 'ID of the authorization', required: true}),
  }
  static description = 'show an existing OAuth authorization'
  static enableJsonFlag = true

  async run(): Promise<OauthAuthorization> {
    const {platform} = createSDK(this.heroku)
    const {args} = await this.parse(AuthorizationsInfo)

    const authentication = await platform.oauthAuthorization.info(args.id)

    this.log(format(authentication))
    return authentication
  }
}
