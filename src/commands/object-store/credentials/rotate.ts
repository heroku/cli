import {flags as Flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {confirmCommand} from '@heroku/heroku-cli-util/hux'
import {AddonResolver} from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/data/base-command.js'
import {OBJECT_STORE_ADDON_SERVICE} from '../../../lib/object-store/addon.js'

export default class ObjectStoreCredentialsRotate extends BaseCommand {
  static args = {
    object_store: Args.string({
      description: 'object store name, attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'rotate a scoped credential on an object store'
  static examples = [
    '<%= config.bin %> <%= command.id %> object_store_name --name reports --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    name: Flags.string({char: 'n', default: 'default', description: 'credential to rotate'}),
    remote: Flags.remote(),
    'revoke-active': Flags.boolean({description: 'immediately revoke active sessions instead of letting them expire'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ObjectStoreCredentialsRotate)
    const {app, confirm, name} = flags
    const revokeActive = flags['revoke-active']
    const {object_store: objectStore} = args

    const addonResolver = new AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(objectStore, app, OBJECT_STORE_ADDON_SERVICE)

    const warning = revokeActive
      ? `This immediately revokes active sessions for the ${color.name(name)} credential; apps using it lose access until they pick up the new token.`
      : `This rotates the ${color.name(name)} credential; existing sessions keep working until they expire.`
    await confirmCommand({comparison: app, confirmation: confirm, warningMessage: `Destructive Action\n${warning}`})

    try {
      ux.action.start(`Rotating credential ${color.name(name)} on ${color.addon(addon.name)}`)
      await this.dataApi.post(`/object-stores/${addon.id}/credentials/${encodeURIComponent(name)}/rotate`, {
        body: {revoke_active: Boolean(revokeActive)},
      })
      ux.action.stop()
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
