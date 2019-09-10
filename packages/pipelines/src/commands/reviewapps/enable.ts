import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

export default class ReviewappsEnable2 extends Command {
  static description = 'enable review apps and/or settings on an existing pipeline'

  static examples = [
    `$ heroku reviewapps:enable -p mypipeline --autodeploy --autodestroy
`,
  ]

  static flags = {
    pipeline: flags.string({char: 'p', description: 'name of pipeline', required: true}),
    autodeploy: flags.boolean({description: 'autodeploy the review app', required: false}),
    autodestroy: flags.boolean({description: 'autodestroy the review app', required: false}),
  }

  async run() {
    const {flags} = this.parse(ReviewappsEnable2)

    let settings: {
      automatic_review_apps: boolean,
      destroy_stale_apps: boolean,
      pipeline: string | undefined,
      repo: string | undefined
    } = {
      automatic_review_apps: false,
      destroy_stale_apps: false,
      pipeline: undefined,
      repo: undefined
    }

    if (flags.autodeploy) {
      this.log('Enabling auto deployment...')
      settings.automatic_review_apps = true
    }

    if (flags.autodestroy) {
      this.log('Enabling auto destroy...')
      settings.destroy_stale_apps = true
    }

    cli.action.start('Configuring pipeline')

    let {body: pipeline} = await this.heroku.get<Heroku.Pipeline>(`/pipelines/${flags.pipeline}`)

    settings.pipeline = pipeline.id

    let {body: feature} = await this.heroku.get<Heroku.AccountFeature>('/account/features/dashboard-repositories-api')

    if (feature.enabled) {
      let {body: repo} = await this.heroku.get(`/pipelines/${pipeline.id}/repo`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.repositories-api'}
      })
      settings.repo = repo.full_name
    } else {
      let {body: repo} = await this.heroku.get(`/pipelines/${pipeline.id}/repository`)
      settings.repo = repo.repository.name
    }

    await this.heroku.post(`/pipelines/${pipeline.id}/review-app-config`, {
      body: settings,
      headers: {Accept: 'application/vnd.heroku+json; version=3.review-apps'}
    })

    cli.action.stop()
  }
}
