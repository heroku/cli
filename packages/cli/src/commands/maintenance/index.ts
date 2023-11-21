import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export default class MaintenanceIndex extends Command {
  static description = 'display the current maintenance status of app'
  static topic = 'maintenance'

  static flags = {
    app: flags.app({required: true}),
  }

  async run() {
    const {flags} = await this.parse(MaintenanceIndex)
    const appResponse = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)
    const app = appResponse.body
    ux.log(app.maintenance ? 'on' : 'off')
  }
}
