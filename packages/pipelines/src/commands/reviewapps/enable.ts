import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

export default class ReviewappsEnable extends Command {
  static description = 'enable review apps and/or settings on an existing pipeline'

  static examples = [
    '$ heroku reviewapps:enable -p my-pipeline -a my-app --autodeploy --autodestroy --beta',
  ]

  static flags = {
    app: flags.app({
      description: 'parent app used by review apps',
    }),
    remote: flags.remote(),
    pipeline: flags.string({
      char: 'p',
      description: 'name of pipeline',
      required: true,
    }),
    autodeploy: flags.boolean({
      description: 'autodeploy the review app',
    }),
    autodestroy: flags.boolean({
      description: 'autodestroy the review app',
    }),
    beta: flags.boolean({
      description: 'use Review Apps Beta',
    })
  }

  async run() {
    const {flags} = this.parse(ReviewappsEnable)

    if (flags.app && flags.beta) {
      // remove app & remote flags when Review Apps 1.0 is deprecated
      this.warn('Specifying an app via --app or --remote is no longer needed when using --beta')
    }

    let settings: {
      automatic_review_apps: boolean,
      destroy_stale_apps: boolean,
      pipeline?: string,
      repo?: string,
      pull_requests: {enabled: boolean}
    } = {
      automatic_review_apps: false,
      destroy_stale_apps: false,
      pipeline: undefined,
      repo: undefined,
      pull_requests: {enabled: false}
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

    if (flags.beta) {
      await this.heroku.post(`/pipelines/${pipeline.id}/review-app-config`, {
        body: settings,
        headers: {Accept: 'application/vnd.heroku+json; version=3.review-apps'}
      })
    } else {
      let {body: app} = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)

      settings.pull_requests = {enabled: true}

      await this.heroku.patch(`/apps/${app.id}/github`, {
        hostname: 'kolkrabbi.heroku.com',
        body: settings
      })
    }

    cli.action.stop()
  }
}
