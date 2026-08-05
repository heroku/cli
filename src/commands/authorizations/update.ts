import {Command, flags} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {OauthAuthorizationUpdateOpts} from '@heroku/types/3.sdk'
import {Args, ux} from '@oclif/core'

import {display} from '../../lib/authorizations/authorizations.js'

export default class AuthorizationsUpdate extends Command {
  static args = {
    id: Args.string({description: 'ID of the authorization', required: true}),
  }
  static description = 'updates an OAuth authorization'
  static flags = {
    'client-id': flags.string({dependsOn: ['client-secret'], description: 'identifier of OAuth client to set'}),
    'client-secret': flags.string({dependsOn: ['client-id'], description: 'secret of OAuth client to set'}),
    description: flags.string({char: 'd', description: 'set a custom authorization description'}),
  }

  async run() {
    const {platform} = new HerokuSDK()
    const {args, flags} = await this.parse(AuthorizationsUpdate)

    ux.action.start('Updating OAuth Authorization')

    let client
    if (flags['client-id']) {
      client = {
        id: flags['client-id'],
        secret: flags['client-secret'],
      }
    }

    const authentication = await platform.oauthAuthorization.update(args.id, {
      client,
      description: flags.description,
    } as OauthAuthorizationUpdateOpts)

    ux.action.stop()

    display(authentication)
  }
}
