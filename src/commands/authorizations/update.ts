import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
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
    const {args, flags} = await this.parse(AuthorizationsUpdate)

    ux.action.start('Updating OAuth Authorization')

    let client
    if (flags['client-id']) {
      client = {
        id: flags['client-id'],
        secret: flags['client-secret'],
      }
    }

    const {body: authentication} = await this.heroku.patch<Heroku.OAuthAuthorization>(
      `/oauth/authorizations/${args.id}`,
      {
        body: {
          client,
          description: flags.description,
        },
      },
    )

    ux.action.stop()

    display(authentication)
  }
}
