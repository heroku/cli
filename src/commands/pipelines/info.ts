import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args} from '@oclif/core'

import {listPipelineApps} from '../../lib/api.js'
import disambiguate from '../../lib/pipelines/disambiguate.js'
import renderPipeline from '../../lib/pipelines/render-pipeline.js'

export default class PipelinesInfo extends Command {
  static args = {
    pipeline: Args.string({
      description: 'pipeline to show list of apps for',
      required: true,
    }),
  }

  static description = 'show list of apps in a pipeline'

  static examples = [
    color.command('heroku pipelines:info my-pipeline'),
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

  async run() {
    const {args, flags} = await this.parse(PipelinesInfo)
    const pipeline: Heroku.Pipeline = await disambiguate(this.heroku, args.pipeline)
    const pipelineApps = await listPipelineApps(this.heroku, pipeline.id!)

    if (flags.json) {
      // eslint-disable-next-line perfectionist/sort-objects
      hux.styledJSON({pipeline, apps: pipelineApps})
    } else {
      await renderPipeline(this.heroku, pipeline, pipelineApps, {
        showOwnerWarning: true,
        withOwners: flags['with-owners'],
      })
    }
  }
}
