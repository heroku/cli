import {flags as Flags} from '@heroku-cli/command'
import {color, hux, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../lib/data/base-command.js'
import {Window} from '../../../../lib/data/types.js'

export default class DataMaintenancesWindowUpdate extends BaseCommand {
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

    const {body: result} = await this.dataApi.post<Window>(
      `/data/maintenances/v1/${addon.id}/window`,
      {
        ...this.dataApi.defaults,
        body: {
          day_of_week: args.day_of_week,
          time_of_day: args.time_of_day,
        },
      },
    )
    ux.action.stop()

    if (flags.json) {
      hux.styledJSON(result)
    } else {
      hux.styledObject(result)
    }
  }
}
