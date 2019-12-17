import {Command, flags} from '@heroku-cli/command'
import Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

import {listPipelineApps} from '../../api'
import disambiguate from '../../disambiguate'
import renderPipeline from '../../render-pipeline'

export default class PipelinesInfo extends Command {
  static description = 'show list of apps in a pipeline'

  static examples = [
    '$ heroku pipelines:info my-pipeline',
  ]

  static flags = {
    json: flags.boolean({
      description: 'output in json format',
    }),
    'with-owners': flags.boolean({
      description: 'shows owner of every app',
      hidden: true,
    }),
  }

  static args = [{
    name: 'pipeline',
    description: 'pipeline to show list of apps for',
    required: true,
  }]

  async run() {
    const {args, flags} = this.parse(PipelinesInfo)
    const pipeline: Heroku.Pipeline = await disambiguate(this.heroku, args.pipeline)
    const pipelineApps = await listPipelineApps(this.heroku, pipeline.id!)

    if (flags.json) {
      cli.styledJSON({pipeline, apps: pipelineApps})
    } else {
      await renderPipeline(this.heroku, pipeline, pipelineApps, {
        withOwners: flags['with-owners'],
        showOwnerWarning: true,
      })
    }
  }
}
