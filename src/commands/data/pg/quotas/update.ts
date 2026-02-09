import {color, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import type {Quota} from '../../../../lib/data/types.js'

import BaseCommand from '../../../../lib/data/baseCommand.js'
import {displayQuota} from '../../../../lib/data/displayQuota.js'

type QuotaUpdate = {
  critical_gb?: null | number,
  enforcement_action?: string
  warning_gb?: null | number,
}

const heredoc = tsheredoc.default
const validateQuotaSetting = function (flagName: string, settingAmt: string | undefined) {
  if (settingAmt && settingAmt !== 'none' && !Number.parseInt(settingAmt, 10)) {
    ux.error(heredoc(`
        Parsing --${flagName}
        You can only enter an integer or "none" in the --${flagName} flag.
        See more help with --help
      `))
  }
}

export default class DataPgQuotasUpdate extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'update quota settings on a Postgres Advanced database'

  static examples = ['<%= config.bin %> <%= command.id %> --app example-app --type storage --warning 12 --critical 15 --enforcement-action notify']

  static flags = {
    app: Flags.app({required: true}),
    critical: Flags.string({description: 'set critical threshold in GB, set to "none" to remove threshold'}),
    'enforcement-action': Flags.string({
      description: 'set enforcement action for when database surpasses the critical threshold',
      options: ['notify', 'restrict', 'none'],
    }),
    remote: Flags.remote(),
    type: Flags.string({
      description: 'type of quota to update',
      options: ['storage'],
      required: true,
    }),
    warning: Flags.string({description: 'set warning threshold in GB, set to "none" to remove threshold'}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgQuotasUpdate)
    const {database} = args
    const {app, critical, 'enforcement-action': enforcementAction, type, warning} = flags

    if (!warning && !critical && !enforcementAction) {
      ux.error('You must set a value for either the warning, critical, or enforcement-action flags')
    }

    validateQuotaSetting('warning', warning)
    validateQuotaSetting('critical', critical)

    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(database, app, utils.pg.addonService())

    if (!utils.pg.isAdvancedDatabase(addon)) {
      ux.error('You can only use this command on Advanced-tier databases.')
    }

    const quotaUpdate: QuotaUpdate = {}
    if (warning) quotaUpdate.warning_gb = warning === 'none' ? null : Number.parseInt(warning, 10)
    if (critical) quotaUpdate.critical_gb = critical === 'none' ? null : Number.parseInt(critical, 10)
    if (enforcementAction) quotaUpdate.enforcement_action = enforcementAction

    ux.action.start(`Updating ${type} quota on ${color.datastore(database)}`)
    const {body: updatedQuota} = await this.dataApi.patch<Quota>(`/data/postgres/v1/${addon.id}/quotas/${type}`, {
      body: quotaUpdate,
    })
    ux.action.stop()

    displayQuota(updatedQuota)
  }
}
