import {Command, flags as Flags} from '@heroku-cli/command'
import {color, hux, utils} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

import {Window} from '../../../../lib/data/types.js'

export default class DataMaintenancesWindowUpdate extends Command {
  static args = {
    addon: Args.string({
      description: 'addon to change window for',
      required: true,
    }),
    day_of_week: Args.string({
      description: 'UTC maintenance window day of the week',
      required: true,
    }),
    time_of_day: Args.string({
      description: 'UTC maintenance window time of day',
      required: true,
    }),
  }
  static description = 'update maintenance window on an add-on'
  static examples = [
    '$ heroku data:maintenances:window postgresql-sinuous-92834 sunday 13:30',
    '$ heroku data:maintenances:window postgresql-sinuous-92834 sunday 1:30PM',
    '$ heroku data:maintenances:window DATABASE sunday 1:30PM --app production-app',
  ]
  static flags = {
    app: Flags.app({description: 'app to update addon maintenance window for'}),
    json: Flags.boolean({char: 'j', description: 'output result in json'}),
    remote: Flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(DataMaintenancesWindowUpdate)
    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(args.addon, flags.app)

    const combinedWindowLabel = `${args.day_of_week} ${args.time_of_day}`
    ux.action.start(`Setting maintenance window for ${color.addon(addon.name!)} to ${combinedWindowLabel}`)

    const {data} = new HerokuSDK()
    const result = await data.maintenance.updateWindow(addon.id!, {
      day_of_week: args.day_of_week,
      time_of_day: args.time_of_day,
    }) as unknown as Window
    ux.action.stop()

    if (flags.json) {
      hux.styledJSON(result)
    } else {
      hux.styledObject(result)
    }
  }
}
