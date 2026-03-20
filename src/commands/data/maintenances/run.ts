import {flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {color} from '@heroku/heroku-cli-util'
import * as utils from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/data/baseCommand.js'
import {waitUntilMaintenanceComplete} from '../../../lib/data/utils.js'

export default class DataMaintenancesRun extends BaseCommand {
  static args = {
    addon: Args.string({
      description: 'data addon to run maintenance on',
      required: true,
    }),
  }

  static description = 'triggers a scheduled maintenance for a data add-on'

  static examples = [
    '$ heroku data:maintenances:run postgresql-sinuous-92834',
    '$ heroku data:maintenances:run postgresql-sinuous-92834 --confirm production-app',
    '$ heroku data:maintenances:run postgresql-sinuous-92834 --wait',
    '$ heroku data:maintenances:run DATABASE --app production-app',
  ]

  static flags = {
    app: Flags.app({description: 'app to run addon maintenance for'}),
    confirm: Flags.string({
      char: 'c',
      description: 'confirms running maintenance without entering application maintenance mode if the app name matches',
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'start maintenance without entering application maintenance mode',
      hidden: true,
    }),
    remote: Flags.remote(),
    wait: Flags.boolean({
      char: 'w',
      description: 'wait for maintenance to complete before exiting',
    }),
  }

  async confirmMaintenanceMode(addon: Heroku.AddOn, confirm: string | undefined, force: boolean) {
    const {body: app} = await this.heroku.get<Heroku.App>(`/apps/${addon!.app!.id}`)
    const appName = app.name || ''
    if (Boolean(app.maintenance) || Boolean(force)) {
      // app is in maintenance mode, or it was forced
    } else if (!confirm || confirm !== appName) {
      ux.warn('Application is not in maintenance mode.')
      this.error(`To proceed, put the application into maintenance mode or re-run the command with ${color.bold.red(`--confirm ${appName}`)}`)
    }
  }

  async run() {
    const {args, flags} = await this.parse(DataMaintenancesRun)
    const addonResolver = new utils.AddonResolver(this.heroku)
    const {app, confirm, force, wait} = flags
    const addon = await addonResolver.resolve(args.addon, app, utils.getAddonService())

    const isEssentialTier = utils.isEssentialDatabase(addon) || utils.isLegacyEssentialDatabase(addon)
    if (isEssentialTier) {
      this.error('You can\'t trigger maintenance on an Essential tier database.')
    }

    await this.confirmMaintenanceMode(addon, confirm, force || false)

    ux.action.start('Triggering maintenance')
    await this.dataApi.post(
      `/data/maintenances/v1/${addon.id}/run`,
      this.dataApi.defaults,
    )
    ux.action.stop('maintenance triggered')

    if (wait) {
      ux.action.start('Waiting for maintenance to complete')
      await waitUntilMaintenanceComplete(addon.id!, this.dataApi)
      ux.action.stop('maintenance completed')
    }
  }
}
