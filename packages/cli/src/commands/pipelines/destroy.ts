import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'

import {destroyPipeline} from 'src/lib/pipelines/api'
import disambiguate from 'src/lib/pipelines/disambiguate'

const cli = CliUx.ux

export default class PipelinesDestroy extends Command {
  static description = 'destroy a pipeline'

  static examples = [
    '$ heroku pipelines:destroy my-pipeline',
  ]

  static args = [{
    name: 'pipeline',
    description: 'name of pipeline',
    required: true,
  }]

  async run() {
    const {args} = await this.parse(PipelinesDestroy)
    const pipeline: Heroku.Pipeline = await disambiguate(this.heroku, args.pipeline)

    cli.action.start(`Destroying ${color.pipeline(pipeline.name!)} pipeline`)
    await destroyPipeline(this.heroku, pipeline.name, pipeline.id)
    cli.action.stop()
  }
}
