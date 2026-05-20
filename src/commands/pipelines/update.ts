import {Command, flags} from '@heroku-cli/command'
import {StageCompletion} from '@heroku-cli/command/lib/completions.js'
import * as color from '@heroku/heroku-cli-util/color'
import {createPlatformClient} from '@heroku/sdk/platform'
import {ux} from '@oclif/core/ux'

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

    const {app, stage} = flags
    const heroku = createPlatformClient()

    ux.action.start(`Changing ${color.app(app)} to ${stage}`)
    const coupling = await heroku.pipelineCoupling.infoByApp(app)
    await heroku.pipelineCoupling.update(coupling.id!, {stage: stage as 'development' | 'production' | 'review' | 'staging' | 'test'})
    ux.action.stop()
  }
}
