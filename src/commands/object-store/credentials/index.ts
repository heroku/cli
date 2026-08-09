import {flags as Flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {styledHeader, table} from '@heroku/heroku-cli-util/hux'
import {AddonResolver} from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/data/base-command.js'
import {OBJECT_STORE_ADDON_SERVICE} from '../../../lib/object-store/addon.js'
import {ObjectStoreCredentialInfo} from '../../../lib/object-store/types.js'

export default class ObjectStoreCredentialsIndex extends BaseCommand {
  static args = {
    object_store: Args.string({
      description: 'object store name, attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'list scoped credentials on an object store'
  static examples = [
    '<%= config.bin %> <%= command.id %> object_store_name --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(ObjectStoreCredentialsIndex)
    const {app} = flags
    const {object_store: objectStore} = args

    const addonResolver = new AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(objectStore, app, OBJECT_STORE_ADDON_SERVICE)

    const {body: credentials} = await this.dataApi.get<ObjectStoreCredentialInfo[]>(`/object-stores/${addon.id}/credentials`)

    if (credentials.length === 0) {
      ux.stdout('No credentials found for this object store.')
      return
    }

    styledHeader(`Scoped credentials for ${color.addon(addon.name)}`)
    table(credentials, {
      Credential: {
        get: cred => cred.default ? `${color.name(cred.name)} (default)` : color.name(cred.name),
      },
      Prefix: {
        get: cred => cred.key_prefix || '(whole bucket)',
      },
      // eslint-disable-next-line perfectionist/sort-objects
      Capabilities: {
        get: cred => cred.capabilities.join(', '),
      },

      State: {
        get: cred => cred.state,
      },
    })
  }
}
