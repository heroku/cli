import {Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'

// import {listPipelineApps} from '../../api'
// import disambiguate from '../../disambiguate'
// import renderPipeline from '../../render-pipeline'

export default class PipelinesInfo extends Command {
  static description = 'show list of apps in a pipeline'

  static examples = [
    `$ heroku pipelines:info example
    === example
    owner: my-team (team)

    app name                     stage
    ───────────────────────────  ──────────
    ⬢ example-pr-16              review
    ⬢ example-pr-19              review
    ⬢ example-pr-23              review
    ⬢ example-staging            staging
    ⬢ example-staging-2          staging
    ⬢ example-production         production`
  ]

  static flags = {
    format: flags.string({
      name: 'json',
      description: 'output in json format',
    }),
    owner: flags.string({
      name: 'with-owners',
      description: 'shows owner of every app',
      hidden: true
    })
  }

  static args = [{
    name: 'pipeline',
    description: 'pipeline to show',
    optional: false
  }]

  async run() {
    // const {args, flags} = this.parse(PipelinesInfo)
    // const pipeline: any = await disambiguate(this.heroku, args.pipeline)
    // const pipelineApps = await listPipelineApps(this.heroku, pipeline.id)

    // if (flags.format) {
    //   cli.styledJSON({pipeline, apps: pipelineApps})
    // } else {
    //     await renderPipeline(this.heroku, pipeline, pipelineApps, {
    //         withOwners: true,
    //         showOwnerWarning: true
    //     })
    // }
  }
}
