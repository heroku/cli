import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {StageCompletion} from '@heroku-cli/command/lib/completions.js'
import {ux} from '@oclif/core'

import {updateCoupling} from '../../lib/api.js'

export default class PipelinesUpdate extends Command {
  static description = 'update the app\'s stage in a pipeline'

  static examples = [
    color.command('heroku pipelines:update -s staging -a my-app'),
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    stage: flags.string({
      char: 's',
      completion: StageCompletion,
      description: 'new stage of app',
      required: true,
    }),
  }

  async run() {
    const {flags} = await this.parse(PipelinesUpdate)

    const {app} = flags
    const {stage} = flags

    ux.action.start(`Changing ${color.app(app)} to ${stage}`)
    await updateCoupling(this.heroku, app, stage)
    ux.action.stop()
  }
}
