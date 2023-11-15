import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

export default class MaintenanceIndex extends Command {
  static description = 'display the current maintenance status of app'
  static topic = 'maintenance'

  static args = {
    app: Args.string({required: true}),
  }

  async run() {
    const {args} = await this.parse(MaintenanceIndex)
    const appResponse = await this.heroku.get<Heroku.App>(`/apps/${args.app}`)
    const app = appResponse.body
    ux.log(app.maintenance ? 'on' : 'off')
  }
}
