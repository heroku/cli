import {flags as Flags} from '@heroku-cli/command'
import {postgresQuotaExtensions} from '@heroku/sdk/extensions/data'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../lib/data/base-command.js'
import {displayQuota} from '../../../../lib/data/display-quota.js'
import {createSDK} from '../../../../lib/sdk.js'

export default class DataPgQuotasIndex extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'display quotas set on a Postgres Advanced database'
  static examples = [
    '<%= config.bin %> <%= command.id %> database_name --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
    type: Flags.string({description: 'type of quota', options: ['storage']}),
  }

  async run() {
    const {args, flags} = await this.parse(DataPgQuotasIndex)
    const {app, type} = flags
    const {database} = args
    const {data} = createSDK(this.heroku, {extensions: [postgresQuotaExtensions]})

    try {
      if (type) {
        const {quota} = await data.postgresQuota.info(database, type, {appIdentity: app})
        displayQuota(quota)
      } else {
        const {quotas} = await data.postgresQuota.list(database, {appIdentity: app})

        for (const quota of quotas.items ?? []) {
          displayQuota(quota)
          ux.stdout('')
        }
      }
    } catch (error) {
      if (error instanceof NotAdvancedDatabaseError) {
        ux.error('You can only use this command on Advanced-tier databases')
      }

      throw error
    }
  }
}
