import {color} from '@heroku/heroku-cli-util'
import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import {updatePipeline} from '../../lib/api.js'
import disambiguate from '../../lib/pipelines/disambiguate.js'

export default class PipelinesRename extends Command {
  static args = {
    name: Args.string({
      description: 'new name of pipeline',
      required: true,
    }),
    pipeline: Args.string({
      description: 'current name of pipeline',
      required: true,
    }),
  }

  static description = 'rename a pipeline'

  static examples = [
    color.command('heroku pipelines:rename my-pipeline new-pipeline-name'),
  ]

  async run() {
    const {args} = await this.parse(PipelinesRename)

    const pipeline = await disambiguate(this.heroku, args.pipeline)

    ux.action.start(`Renaming ${color.pipeline(pipeline.name!)} pipeline to ${color.info(args.name)}`)

    await updatePipeline(this.heroku, pipeline.id!, {
      name: args.name,
    })

    ux.action.stop()
  }
}
