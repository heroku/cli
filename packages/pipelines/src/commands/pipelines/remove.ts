import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'

import {removeCoupling} from '../../api'

export default class PipelinesRemove extends Command {
  static description = 'remove this app from its pipeline'

  static examples = [
    '$ heroku pipelines:remove -a my-app'
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote()
  }

  async run() {
    let {flags: {app}} = this.parse(PipelinesRemove)

    cli.action.start(`Removing ${color.app(app)}`)
    await removeCoupling(this.heroku, app)
    cli.action.stop()
  }
}
