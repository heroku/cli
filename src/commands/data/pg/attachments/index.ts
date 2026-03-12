import {color, hux, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import type {CredentialInfo, CredentialsInfo} from '../../../../lib/data/types.js'

import BaseCommand from '../../../../lib/data/baseCommand.js'

export default class DataPgAttachmentsIndex extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'list attachments on a Postgres Advanced database'

  static examples = [
    '<%= config.bin %> <%= command.id %> database_name -a example-app',
  ]

  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(DataPgAttachmentsIndex)
    const {app} = flags
    const {database} = args

    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(database, app, utils.pg.addonService())

    if (!utils.pg.isAdvancedDatabase(addon)) {
      ux.error(
        'You can only use this command on Advanced-tier databases.\n'
          + `Use ${color.code(`heroku addons:info ${addon.name} -a ${app}`)} instead.`,
      )
    }

    const [{body: {items: credentials}}, {body: attachments}] = await Promise.all([
      this.dataApi.get<CredentialsInfo>(`/data/postgres/v1/${addon.id}/credentials`),
      this.heroku.get<Required<Heroku.AddOnAttachment>[]>(`/addons/${addon.id}/addon-attachments`),
    ])
    const ownerCred = credentials.find((cred: CredentialInfo) => cred.type === 'owner')

    if (attachments.length === 0) {
      ux.stdout('No attachments found for this database.')
      return
    }

    hux.styledHeader(`Attachments for ${color.datastore(addon.name)}`)
    hux.table(attachments, {
      Attachment: {
        get: attachment => `${color.attachment(attachment.app.name! + '::' + attachment.name)}`,
      },
      Credential: {
        get(attachment) {
          if (attachment.namespace?.startsWith('role:')) {
            return color.name(attachment.namespace.split(':')[1])
          }

          return `${ownerCred?.name ? `${color.name(ownerCred.name)} (owner)` : ''}`
        },
      },
      Pool: {
        get(attachment) {
          return color.name(attachment.namespace?.startsWith('pool:')
            ? attachment.namespace.split(':')[1]
            : 'leader')
        },
      },
    })
  }
}
