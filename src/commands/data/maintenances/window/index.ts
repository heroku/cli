import {flags as Flags} from '@heroku-cli/command'
import {color, hux, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../lib/data/base-command.js'
import {Window} from '../../../../lib/data/types.js'

export default class DataMaintenancesWindow extends BaseCommand {
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
    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(args.addon, flags.app)

    ux.action.start(`Fetching maintenance window for ${color.addon(addon.name!)}`)
    const {body: window} = await this.dataApi.get<Window>(
      `/data/maintenances/v1/${addon.id}/window`,
      this.dataApi.defaults,
    )
    ux.action.stop()

    if (flags.json) {
      hux.styledJSON(window)
    } else {
      hux.styledObject(window)
    }
  }
}
