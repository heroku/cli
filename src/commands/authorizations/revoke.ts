import type {OauthAuthorization} from '@heroku/types/3.sdk'

import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

import {createSDK} from '../../lib/sdk.js'

export default class AuthorizationsRevoke extends Command {
  static aliases = ['authorizations:destroy']
  static args = {
    id: Args.string({description: 'ID of the authorization', required: true}),
  }
  static description = 'revoke OAuth authorization'
  static enableJsonFlag = true
  static examples = [
    color.command('heroku authorizations:revoke 105a7bfa-34c3-476e-873a-b1ac3fdc12fb'),
  ]

  async run(): Promise<OauthAuthorization> {
    const {platform} = createSDK(this.heroku)
    const {args} = await this.parse(AuthorizationsRevoke)

    ux.action.start('Revoking OAuth Authorization')
    let auth: OauthAuthorization
    try {
      auth = await platform.oauthAuthorization.delete(args.id)
    } catch (error) {
      // Under --json, oclif's catch() leaves the spinner running and it swallows the error output.
      ux.action.stop(color.red('!'))
      throw error
    }

    ux.action.stop(`done, revoked authorization from ${color.cyan(auth.description)}`)
    return auth
  }
}
