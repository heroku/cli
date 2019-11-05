import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

import KolkrabbiAPI from '../../kolkrabbi-api'

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
    'wait-for-ci': flags.boolean({
      description: 'disable wait for CI',
    })
  }

  async run() {
    const {flags} = this.parse(ReviewappsDisable)

    if (flags.app) {
      // remove app & remote flags when Review Apps 1.0 is deprecated
      this.warn('Specifying an app via --app or --remote is no longer needed with Review Apps')
    }

    let settings: {
      automatic_review_apps?: boolean,
      destroy_stale_apps?: boolean,
      wait_for_ci?: boolean,
      pipeline?: string,
      repo?: string
    } = {
      automatic_review_apps: undefined,
      destroy_stale_apps: undefined,
      wait_for_ci: undefined,
      pipeline: undefined,
      repo: undefined
    }

    if (flags.autodeploy) {
      this.log('Disabling auto deployment...')
      settings.automatic_review_apps = false
    }

    if (flags.autodestroy) {
      this.log('Disabling auto destroy...')
      settings.destroy_stale_apps = false
    }

    if (flags['wait-for-ci']) {
      this.log('Disabling wait for CI...')
      settings.wait_for_ci = false
    }

    const kolkrabbi = new KolkrabbiAPI(this.config.userAgent, this.heroku.auth)

    cli.action.start('Configuring pipeline')

    let {body: pipeline} = await this.heroku.get<Heroku.Pipeline>(`/pipelines/${flags.pipeline}`)

    settings.pipeline = pipeline.id

    try {
      let {body: feature} = await this.heroku.get<Heroku.AccountFeature>('/account/features/dashboard-repositories-api')

      if (feature.enabled) {
        let {body: repo} = await this.heroku.get(`/pipelines/${pipeline.id}/repo`, {
          headers: {Accept: 'application/vnd.heroku+json; version=3.repositories-api'}
        })
        settings.repo = repo.full_name
      }
    } catch {
      let {repository} = await kolkrabbi.getPipelineRepository(pipeline.id)
      settings.repo = repository.name
    }

    if (flags.autodeploy || flags.autodestroy || flags['wait-for-ci']) {
      await this.heroku.patch(`/pipelines/${pipeline.id}/review-app-config`, {
        body: settings,
        headers: {Accept: 'application/vnd.heroku+json; version=3.review-apps'}
      })
    } else {
      // if no flags are passed then the user is disabling review apps
      await this.heroku.delete(`/pipelines/${pipeline.id}/review-app-config`, {
        body: settings,
        headers: {Accept: 'application/vnd.heroku+json; version=3.review-apps'}
      })
    }

    cli.action.stop()
  }
}
