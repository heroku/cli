import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'
import {ux} from '@oclif/core'

export default class MaintenanceOff extends Command {
  static description = 'take the app out of maintenance mode'
  static topic = 'maintenance'

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {flags} = await this.parse(MaintenanceOff)
    ux.action.start(`Disabling maintenance mode for ${color.app(flags.app)}`)
    await this.heroku.patch<Heroku.App>(`/apps/${flags.app}`, {body: {maintenance: false}})
    ux.action.stop()
  }
}
