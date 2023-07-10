import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {destroyPipeline} from '../../lib/pipelines/api'
import disambiguate from '../../lib/pipelines/disambiguate'

export default class PipelinesDestroy extends Command {
  static description = 'destroy a pipeline'

  static examples = [
    '$ heroku pipelines:destroy my-pipeline',
  ]

  static args = {
    pipeline: Args.string({
      description: 'name of pipeline',
      required: true,
    }),
  }

  async run() {
    const {args} = await this.parse(PipelinesDestroy)
    const pipeline: Heroku.Pipeline = await disambiguate(this.heroku, args.pipeline)

    ux.action.start(`Destroying ${color.pipeline(pipeline.name!)} pipeline`)
    await destroyPipeline(this.heroku, pipeline.name, pipeline.id)
    ux.action.stop()
  }
}
