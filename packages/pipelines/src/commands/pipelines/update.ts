import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {StageCompletion} from '@heroku-cli/command/lib/completions'
import cli from 'cli-ux'

import {updateCoupling} from '../../api'

export default class PipelinesUpdate extends Command {
  static description = 'update the app\'s stage in a pipeline'

  static examples = [
    '$ heroku pipelines:update -s staging -a my-app',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    stage: flags.string({
      char: 's',
      description: 'new stage of app',
      completion: StageCompletion,
      required: true,
    }),
  }

  async run() {
    const {flags} = this.parse(PipelinesUpdate)

    const app = flags.app
    const stage = flags.stage

    cli.action.start(`Changing ${color.app(app)} to ${stage}`)
    await updateCoupling(this.heroku, app, stage)
    cli.action.stop()
  }
}
