import {flags as Flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {maintenanceExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/data/base-command.js'
import {createSDK} from '../../../lib/sdk.js'

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
    const {data} = createSDK(this.heroku, {extensions: [maintenanceExtensions]})

    await data.maintenance.wait(args.addon, {
      appIdentity: flags.app,
      beforeWait({addon}) {
        ux.action.start(`Waiting for maintenance on ${color.addon(addon.name)} to complete`)
      },
    })
    ux.action.stop('maintenance completed')
  }
}
