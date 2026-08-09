import {Command, flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {styledHeader, table} from '@heroku/heroku-cli-util/hux'
import {AddonResolver} from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'

import {OBJECT_STORE_ADDON_SERVICE} from '../../../lib/object-store/addon.js'
import {parseCredential} from '../../../lib/object-store/parse-credential.js'

export default class ObjectStoreAttachmentsIndex extends Command {
  static args = {
    object_store: Args.string({
      description: 'object store name, attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'list attachments on an object store'
  static examples = [
    '<%= config.bin %> <%= command.id %> object_store_name --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(ObjectStoreAttachmentsIndex)
    const {app} = flags
    const {object_store: objectStore} = args

    const addonResolver = new AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(objectStore, app, OBJECT_STORE_ADDON_SERVICE)

    const {body: attachments} = await this.heroku.get<Required<Heroku.AddOnAttachment>[]>(`/addons/${addon.id}/addon-attachments`)

    if (attachments.length === 0) {
      ux.stdout('No attachments found for this object store.')
      return
    }

    styledHeader(`Attachments for ${color.addon(addon.name)}`)
    table(attachments, {
      Attachment: {
        get: attachment => color.attachment(attachment.app.name + '::' + attachment.name),
      },
      Credential: {
        get(attachment) {
          const credential = parseCredential(attachment.namespace)
          return credential ? color.name(credential) : `${color.name('default')} (default)`
        },
      },
    })
  }
}
