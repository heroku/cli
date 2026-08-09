import {flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {confirmCommand} from '@heroku/heroku-cli-util/hux'
import {AddonResolver} from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/data/base-command.js'
import {OBJECT_STORE_ADDON_SERVICE} from '../../../lib/object-store/addon.js'

export default class ObjectStoreCredentialsDestroy extends BaseCommand {
  static args = {
    object_store: Args.string({
      description: 'object store name, attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'destroy a scoped credential on an object store'
  static examples = [
    '<%= config.bin %> <%= command.id %> object_store_name --name reports --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    name: Flags.string({char: 'n', description: 'name of the credential', required: true}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ObjectStoreCredentialsDestroy)
    const {app, confirm, name} = flags
    const {object_store: objectStore} = args

    if (name === 'default') {
      ux.error('You can\'t destroy the default credential.')
    }

    const addonResolver = new AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(objectStore, app, OBJECT_STORE_ADDON_SERVICE)

    const {body: attachments} = await this.heroku.get<Required<Heroku.AddOnAttachment>[]>(`/addons/${addon.id}/addon-attachments`)
    const credAttachmentApps = [...new Set(attachments.filter(a => a.namespace === `credential:${name}`).map(a => a.app.name))]
    if (credAttachmentApps.length > 0) {
      ux.error(`You must detach the credential ${color.name(name)} from the `
        + `app${credAttachmentApps.length > 1 ? 's' : ''} `
        + `${credAttachmentApps.map(appName => color.app(appName || '')).join(', ')} before destroying it.`)
    }

    await confirmCommand({comparison: app, confirmation: confirm})

    try {
      ux.action.start(`Destroying credential ${color.name(name)} on ${color.addon(addon.name)}`)
      await this.dataApi.delete(`/object-stores/${addon.id}/credentials/${encodeURIComponent(name)}`)
      ux.action.stop()
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
