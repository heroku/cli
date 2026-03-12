import {utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import type {Quota, Quotas} from '../../../../lib/data/types.js'

import BaseCommand from '../../../../lib/data/baseCommand.js'
import {displayQuota} from '../../../../lib/data/displayQuota.js'

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

    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(database, app, utils.pg.addonService())

    if (!utils.pg.isAdvancedDatabase(addon)) {
      ux.error('You can only use this command on Advanced-tier databases')
    }

    if (type) {
      const {body: quota} = await this.dataApi.get<Quota>(`/data/postgres/v1/${addon.id}/quotas/${type}`)
      displayQuota(quota)
    } else {
      const {body: quotas} = await this.dataApi.get<Quotas>(`/data/postgres/v1/${addon.id}/quotas`)

      quotas.items.forEach(quota => {
        displayQuota(quota)
        ux.stdout('')
      })
    }
  }
}
