import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {StageCompletion} from '@heroku-cli/command/lib/completions'
import cli from 'cli-ux'

import {updateCoupling} from '../../api'

export default class PipelinesUpdate extends Command {
  static description = 'update this app\'s stage in a pipeline'

  static examples = [
    '$ heroku pipelines:update -s staging -a example-admin'
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    stage: flags.string({char: 's', description: 'new stage of app', completion: StageCompletion})
  }

  async run() {
    let {flags} = this.parse(PipelinesUpdate)

    if (!flags.stage) {
      cli.error('Stage must be specified with -s')
      process.exit(1)
      return
    }

    const app = flags.app
    const stage = flags.stage

    cli.action.start(`Changing ${color.app(app)} to ${stage}`)
    await updateCoupling(this.heroku, app, stage)
    cli.action.stop()
  }
}
