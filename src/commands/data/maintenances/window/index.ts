import {Command, flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {maintenanceExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

import {createSDK} from '../../../../lib/sdk.js'

export default class DataMaintenancesWindow extends Command {
  static args = {
    addon: Args.string({
      description: 'addon to show window for',
      required: true,
    }),
  }
  static description = 'describe the maintenance window on an add-on'
  static examples = [
    '$ heroku data:maintenances:window postgresql-sinuous-92834',
    '$ heroku data:maintenances:window DATABASE --app production-app',
  ]
  static flags = {
    app: Flags.app({description: 'app to show addon maintenance window for'}),
    json: Flags.boolean({char: 'j', description: 'output result in json'}),
    remote: Flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(DataMaintenancesWindow)
    const {data} = createSDK(this.heroku, {extensions: [maintenanceExtensions]})

    const {window} = await data.maintenance.window(args.addon, {
      appIdentity: flags.app,
      beforeGetWindow({addon}) {
        ux.action.start(`Fetching maintenance window for ${color.addon(addon.name)}`)
      },
    })
    ux.action.stop()

    if (flags.json) {
      this.logJson(window)
    } else {
      this.log(hux.styledObject(window))
    }
  }
}
