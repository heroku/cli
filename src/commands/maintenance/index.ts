import {Command, flags} from '@heroku-cli/command'
import {createPlatformClient} from '@heroku/sdk/platform'
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
    const heroku = createPlatformClient()
    const app = await heroku.app.info(flags.app)
    ux.stdout(app.maintenance ? 'on' : 'off')
  }
}
