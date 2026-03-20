import {flags as Flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import * as utils from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/data/baseCommand.js'
import {Maintenance, MaintenanceStatus} from '../../../lib/data/types.js'
import {waitUntilMaintenanceComplete} from '../../../lib/data/utils.js'

export default class DataMaintenancesWait extends BaseCommand {
  static args = {
    addon: Args.string({description: 'data addon', required: true}),
  }

  static description = 'blocks until the maintenance process has completed'

  static examples = [
    '$ heroku data:maintenances:wait postgresql-sinuous-83720',
    '$ heroku data:maintenances:wait DATABASE --app production-app',
  ]

  static flags = {
    app: Flags.app(),
    remote: Flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(DataMaintenancesWait)
    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(args.addon, flags.app, utils.getAddonService())

    const isEssentialTier = utils.isEssentialDatabase(addon) || utils.isLegacyEssentialDatabase(addon)
    if (isEssentialTier) {
      this.error('You can\'t await maintenance on an Essential tier database.')
    }

    const {body: maintenance} = await this.dataApi.get<Maintenance>(
      `/data/maintenances/v1/${addon.id}`,
      this.dataApi.defaults,
    )

    if (maintenance.status !== MaintenanceStatus.running) {
      this.error(`There currently isn't any maintenance in progress for ${color.addon(addon.name!)}`)
    }

    ux.action.start(`Waiting for maintenance on ${color.addon(addon.name!)} to complete`)
    await waitUntilMaintenanceComplete(addon.id!, this.dataApi)
    ux.action.stop('maintenance completed')
  }
}
