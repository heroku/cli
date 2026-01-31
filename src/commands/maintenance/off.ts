import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

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
    await this.heroku.patch<Heroku.App>(`/apps/${flags.app}`, {body: {maintenance: false}})
    ux.action.stop()
  }
}
