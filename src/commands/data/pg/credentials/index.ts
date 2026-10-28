import type {PostgresCredentialInfoResult as AdvancedCredentialInfo} from '@heroku/types/data'

import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {databaseCredentialExtensions} from '@heroku/sdk/extensions/data'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/database-credential'
import {parseAttachmentFactors} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../lib/data/base-command.js'
import {sortByOwnerAndName} from '../../../../lib/data/credential-utils.js'
import {presentCredentialAttachments} from '../../../../lib/pg/util.js'
import {createSDK} from '../../../../lib/sdk.js'
import {huxTableNoWrapOptions} from '../../../../lib/utils/table-utils.js'

export default class DataPgCredentialsIndex extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'list credentials on a Postgres Advanced database'
  static examples = [
    '<%= config.bin %> <%= command.id %> database_name -a example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    'no-wrap': Flags.noWrap(),
    remote: Flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(DataPgCredentialsIndex)
    const {app} = flags
    const {database} = args
    const {data, platform} = createSDK(this.heroku, {extensions: [databaseCredentialExtensions]})

    let addon
    let credentials: AdvancedCredentialInfo[]

    try {
      const result = await data.databaseCredential.list(database, {appIdentity: app})
      addon = result.addon
      credentials = result.credentials.items
    } catch (error) {
      if (error instanceof NotAdvancedDatabaseError) {
        const attachments = await platform.addOnAttachment.listByAddOn(error.addon.id)
        const appAttachment = attachments.find(a => a.app.name === app)
        const suggestedDatabase = appAttachment?.name || database
        ux.error('You can only use this command on Advanced-tier databases.\n'
            + `Use ${color.code(`heroku pg:credentials ${suggestedDatabase} -a ${app}`)} instead.`)
      }

      throw error
    }

    const attachments = await platform.addOnAttachment.listByAddOn(addon.id)
    const sortedCredentials = sortByOwnerAndName(credentials)

    const presentCredential = (cred: AdvancedCredentialInfo): string => {
      const credAttachments = cred.type === 'owner'
        ? attachments.filter(a => {
          const attachmentRole = parseAttachmentFactors(a.namespace).role
          return !attachmentRole || attachmentRole === cred.name
        })
        : attachments.filter(a => {
          const attachmentRole = parseAttachmentFactors(a.namespace).role
          return attachmentRole === cred.name
        })

      return presentCredentialAttachments(app, credAttachments, sortedCredentials, cred.name)
    }

    // hux.table needs Record<string, unknown>; the SDK's interface-based PostgresCredentialInfoResult has no implicit index signature.
    hux.table<AdvancedCredentialInfo & Record<string, unknown>>(credentials as (AdvancedCredentialInfo & Record<string, unknown>)[], {
      Credential: {
        get: presentCredential,
      },
      Type: {
        get: cred => cred.type,
      },
      // eslint-disable-next-line perfectionist/sort-objects
      State: {
        get: cred => cred.state,
      },
    }, huxTableNoWrapOptions(flags['no-wrap']))
  }
}
