import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {removeCoupling} from '../../lib/api.js'

export default class PipelinesRemove extends Command {
  static description = 'remove this app from its pipeline'
  static examples = [
    color.command('heroku pipelines:remove -a my-app'),
  ]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {flags: {app}} = await this.parse(PipelinesRemove)

    ux.action.start(`Removing ${color.app(app)}`)
    await removeCoupling(this.heroku, app)
    ux.action.stop()
  }
}
