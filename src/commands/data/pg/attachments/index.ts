import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {NotAdvancedDatabaseError, parseAttachmentFactors} from '@heroku/sdk/resources/data/postgres-database'
import {AddOnAttachment} from '@heroku/types/3.sdk'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../lib/data/base-command.js'
import {createSDK} from '../../../../lib/sdk.js'

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
    const {data} = createSDK(this.heroku, {extensions: [postgresDatabaseExtensions]})

    try {
      const {addon, attachments, credentials} = await data.postgresDatabase.listAttachments(database, {appIdentity: app})
      const ownerCred = credentials.find(cred => cred.type === 'owner')

      if (attachments.length === 0) {
        ux.stdout('No attachments found for this database.')
        return
      }

      hux.styledHeader(`Attachments for ${color.datastore(addon.name)}`)
      // hux.table needs Record<string, unknown>; the SDK's interface-based AddOnAttachment has no implicit index signature.
      hux.table<AddOnAttachment & Record<string, unknown>>(attachments as (AddOnAttachment & Record<string, unknown>)[], {
        Attachment: {
          get: attachment => `${color.attachment(attachment.app.name + '::' + attachment.name)}`,
        },
        Credential: {
          get(attachment) {
            const attachmentRoleFactor = parseAttachmentFactors(attachment.namespace).role
            if (attachmentRoleFactor && attachmentRoleFactor !== ownerCred?.name) {
              return color.name(attachmentRoleFactor)
            }

            return `${ownerCred?.name ? `${color.name(ownerCred.name)} (owner)` : ''}`
          },
        },
        Pool: {
          get(attachment) {
            const attachmentPoolFactor = parseAttachmentFactors(attachment.namespace).pool
            return color.name(attachmentPoolFactor ?? 'leader')
          },
        },
      })
    } catch (error) {
      if (error instanceof NotAdvancedDatabaseError) {
        ux.error('You can only use this command on Advanced-tier databases.\n'
            + `Use ${color.code(`heroku addons:info ${error.addon.name} -a ${app}`)} instead.`)
      }

      throw error
    }
  }
}
