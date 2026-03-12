import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

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
    await this.heroku.patch<Heroku.App>(`/apps/${flags.app}`, {body: {maintenance: true}})
    ux.action.stop()
  }
}
