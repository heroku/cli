import type {OauthAuthorization} from '@heroku/types/3.sdk'

import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

import {format} from '../../lib/authorizations/authorizations.js'
import {createSDK} from '../../lib/sdk.js'

export default class AuthorizationsRotate extends Command {
  static args = {
    id: Args.string({description: 'ID of the authorization', required: true}),
  }
  static description = 'updates an OAuth authorization token'
  static enableJsonFlag = true

  async run(): Promise<OauthAuthorization> {
    const {platform} = createSDK(this.heroku)
    const {args} = await this.parse(AuthorizationsRotate)

    ux.action.start('Rotating OAuth Authorization')
    let authorization: OauthAuthorization
    try {
      authorization = await platform.oauthAuthorization.regenerate(args.id)
    } catch (error) {
      // Stop the spinner before oclif handles the error. oclif's catch() only stops it when
      // JSON output is off, and a running spinner buffers stdout, so under --json the error
      // document would never be printed.
      ux.action.stop(color.red('!'))
      throw error
    }

    ux.action.stop()

    this.log(format(authorization))
    return authorization
  }
}
