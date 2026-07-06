import {Command, flags} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

export default class MaintenanceIndex extends Command {
  static description = 'display the current maintenance status of app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'maintenance'

  async run() {
    const {flags} = await this.parse(MaintenanceIndex)
    const {platform} = new HerokuSDK()
    const app = await platform.app.info(flags.app)
    ux.stdout(app.maintenance ? 'on' : 'off')
  }
}
