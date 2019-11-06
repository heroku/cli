import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

export default class ReviewappsDisable extends Command {
  static description = 'disable review apps and/or settings on an existing pipeline'

  static examples = [
    '$ heroku reviewapps:disable -p my-pipeline -a my-app --autodeploy'
  ]

  static flags = {
    app: flags.app({
      description: 'parent app used by review apps',
    }),
    remote: flags.remote(),
    pipeline: flags.pipeline({
      required: true,
    }),
    autodeploy: flags.boolean({
      description: 'disable autodeployments'
    }),
    autodestroy: flags.boolean({
      description: 'disable automatically destroying review apps'
    }),
    beta: flags.boolean({
      description: 'use Review Apps 2.0 Beta',
    })
  }

  async run() {
    const {flags} = this.parse(ReviewappsDisable)

    if (flags.app && flags.beta) {
      // remove app & remote flags when Review Apps 1.0 is deprecated
      this.warn('Specifying an app via --app or --remote is no longer needed when using --beta')
    }

    if (flags.beta) {
      this.warn('Review Apps 2.0 is currently in limited beta testing. You may request an invite to the program by opening a support ticket.')
    }

    let settings: {
      automatic_review_apps?: boolean,
      destroy_stale_apps?: boolean,
      pipeline?: string,
      repo?: string,
      pull_requests: {
        enabled?: boolean,
        auto_deploy?: boolean,
        auto_destroy?: boolean
      }
    } = {
      automatic_review_apps: undefined,
      destroy_stale_apps: undefined,
      pipeline: undefined,
      repo: undefined,
      pull_requests: {
        enabled: undefined,
        auto_deploy: undefined,
        auto_destroy: undefined
      }
    }

    if (flags.autodeploy) {
      this.log('Disabling auto deployment...')
      if (flags.beta) {
        settings.automatic_review_apps = false
      } else {
        settings.pull_requests.auto_deploy = false
      }
    }

    if (flags.autodestroy) {
      this.log('Disabling auto destroy...')
      if (flags.beta) {
        settings.destroy_stale_apps = false
      } else {
        settings.pull_requests.auto_destroy = false
      }
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

    if (flags.autodeploy || flags.autodestroy) {
      if (flags.beta) {
        await this.heroku.patch(`/pipelines/${pipeline.id}/review-app-config`, {
          body: settings,
          headers: {Accept: 'application/vnd.heroku+json; version=3.review-apps'}
        })
      } else {
        let {body: app} = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)

        await this.heroku.patch(`/apps/${app.id}/github`, {
          hostname: 'kolkrabbi.heroku.com',
          body: settings
        })
      }
    } else {
      // if no flags are passed then the user is disabling review apps
      if (flags.beta) {
        await this.heroku.delete(`/pipelines/${pipeline.id}/review-app-config`, {
          body: settings,
          headers: {Accept: 'application/vnd.heroku+json; version=3.review-apps'}
        })
      } else {
        let {body: app} = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)

        settings.pull_requests = {enabled: false}

        await this.heroku.patch(`/apps/${app.id}/github`, {
          hostname: 'kolkrabbi.heroku.com',
          body: settings
        })
      }
    }

    cli.action.stop()
  }
}
