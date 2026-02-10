import {color, hux, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import type {CredentialInfo, CredentialsInfo} from '../../../../lib/data/types.js'

import BaseCommand from '../../../../lib/data/baseCommand.js'
import {sortByOwnerAndName} from '../../../../lib/data/credentialUtils.js'
import {presentCredentialAttachments} from '../../../../lib/pg/util.js'

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
    remote: Flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(DataPgCredentialsIndex)
    const {app} = flags
    const {database} = args

    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(database, app, utils.pg.addonService())
    const {body: attachments} = await this.heroku.get<Required<Heroku.AddOnAttachment>[]>(
      `/addons/${addon.id}/addon-attachments`,
    )

    if (!utils.pg.isAdvancedDatabase(addon)) {
      const appAttachment = attachments.find(a => a.app.name === app)
      const suggestedDatabase = appAttachment?.name || database
      ux.error(
        'You can only use this command on Advanced-tier databases.\n'
          + `Use ${color.code(`heroku pg:credentials ${suggestedDatabase} -a ${app}`)} instead.`,
      )
    }

    const {body: {items: credentials}} = await this.dataApi.get<CredentialsInfo>(`/data/postgres/v1/${addon.id}/credentials`)

    const sortedCredentials = sortByOwnerAndName(credentials)

    const presentCredential = (cred: CredentialInfo): string => {
      let credAttachments = [] as Required<Heroku.AddOnAttachment>[]
      if (cred.type === 'owner') {
        credAttachments = attachments.filter(a => a.namespace === null)
      } else {
        credAttachments = attachments.filter(a => a.namespace === `role:${cred.name}`)
      }

      return presentCredentialAttachments(app, credAttachments, sortedCredentials, cred.name)
    }

    hux.table(credentials, {
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
    }, {
      overflow: 'wrap',
    })
  }
}
