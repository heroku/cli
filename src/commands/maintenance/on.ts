import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

export default class MaintenanceOn extends Command {
  static description = 'put the app into maintenance mode'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'maintenance'

  async run() {
    const {flags} = await this.parse(MaintenanceOn)
    ux.action.start(`Enabling maintenance mode for ${color.app(flags.app)}`)
    const {platform} = new HerokuSDK({extensions: [appExtensions]})
    await platform.app.enableMaintenance(flags.app)
    ux.action.stop()
  }
}
