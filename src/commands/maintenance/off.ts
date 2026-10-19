import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {appExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

export default class MaintenanceOff extends Command {
  static description = 'take the app out of maintenance mode'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'maintenance'

  async run() {
    const {flags} = await this.parse(MaintenanceOff)
    ux.action.start(`Disabling maintenance mode for ${color.app(flags.app)}`)
    const {platform} = createSDK(this.heroku, {extensions: [appExtensions]})
    await platform.app.disableMaintenance(flags.app)
    ux.action.stop()
  }
}
