import {flags as Flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {maintenanceExtensions} from '@heroku/sdk/extensions/data'
import {type ResolvedAddOn} from '@heroku/sdk/resources/platform/add-on'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/data/base-command.js'
import {createSDK} from '../../../lib/sdk.js'

type Platform = ReturnType<typeof createSDK>['platform']

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

  async confirmMaintenanceMode(platform: Platform, addon: ResolvedAddOn, confirm: string | undefined, force: boolean) {
    const app = await platform.app.info(addon.app.id)
    const appName = app.name || ''
    if (Boolean(app.maintenance) || Boolean(force)) {
      // app is in maintenance mode, or it was forced
    } else if (!confirm || confirm !== appName) {
      ux.warn('Application is not in maintenance mode.')
      this.error(`To proceed, put the application into maintenance mode or re-run the command with ${color.warning(`--confirm ${appName}`)}`)
    }
  }

  async run() {
    const {args, flags} = await this.parse(DataMaintenancesRun)
    const {app, confirm, force, wait} = flags
    const {data, platform} = createSDK(this.heroku, {extensions: [maintenanceExtensions]})

    const {addon} = await data.maintenance.run(args.addon, {
      appIdentity: app,
      beforeRun: async ({addon}) => {
        await this.confirmMaintenanceMode(platform, addon, confirm, force || false)

        ux.action.start('Triggering maintenance')
      },
    })
    ux.action.stop('maintenance triggered')

    if (wait) {
      ux.action.start('Waiting for maintenance to complete')
      await data.maintenance.wait(addon.id)
      ux.action.stop('maintenance completed')
    }
  }
}
