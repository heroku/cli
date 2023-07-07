import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import {removeCoupling} from '../../lib/pipelines/api'

export default class PipelinesRemove extends Command {
  static description = 'remove this app from its pipeline'

  static examples = [
    '$ heroku pipelines:remove -a my-app',
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
