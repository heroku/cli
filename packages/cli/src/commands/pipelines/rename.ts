import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import {CliUx} from '@oclif/core'

import {updatePipeline} from 'src/lib/pipelines/api'
import disambiguate from 'src/lib/pipelines/disambiguate'

const cli = CliUx.ux

export default class PipelinesRename extends Command {
  static description = 'rename a pipeline'

  static examples = [
    '$ heroku pipelines:rename my-pipeline new-pipeline-name',
  ]

  static args = [
    {
      name: 'pipeline',
      description: 'current name of pipeline',
      required: true,
    },
    {
      name: 'name',
      description: 'new name of pipeline',
      required: true,
    },
  ]

  async run() {
    const {args} = await this.parse(PipelinesRename)

    const pipeline = await disambiguate(this.heroku, args.pipeline)

    cli.action.start(`Renaming ${color.pipeline(pipeline.name!)} pipeline to ${color.pipeline(args.name)}`)

    await updatePipeline(this.heroku, pipeline.id!, {
      name: args.name,
    })

    cli.action.stop()
  }
}
