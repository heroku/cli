import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

export default class MaintenanceIndex extends Command {
  static description = 'display the current maintenance status of app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'maintenance'

  async run() {
    const {flags} = await this.parse(MaintenanceIndex)
    const {platform} = createSDK(this.heroku)
    const app = await platform.app.info(flags.app)
    ux.stdout(app.maintenance ? 'on' : 'off')
  }
}
