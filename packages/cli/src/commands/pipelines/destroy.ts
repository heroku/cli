import {color} from '@heroku/heroku-cli-util'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {destroyPipeline} from '../../lib/api.js'
import disambiguate from '../../lib/pipelines/disambiguate.js'

export default class PipelinesDestroy extends Command {
  static args = {
    pipeline: Args.string({
      description: 'name of pipeline',
      required: true,
    }),
  }

  static description = 'destroy a pipeline'

  static examples = [
    color.command('heroku pipelines:destroy my-pipeline'),
  ]

  async run() {
    const {args} = await this.parse(PipelinesDestroy)
    const pipeline: Heroku.Pipeline = await disambiguate(this.heroku, args.pipeline)

    ux.action.start(`Destroying ${color.pipeline(pipeline.name!)} pipeline`)
    await destroyPipeline(this.heroku, pipeline.name, pipeline.id)
    ux.action.stop()
  }
}
