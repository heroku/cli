import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import KolkrabbiAPI from '../../lib/pipelines/kolkrabbi-api.js'

export default class ReviewappsEnable extends Command {
  static description = 'enable review apps and/or settings on an existing pipeline'

  static examples = [
    color.command('heroku reviewapps:enable -p my-pipeline -a my-app --autodeploy --autodestroy'),
  ]

  static flags = {
    app: flags.app({
      description: 'parent app used by review apps',
    }),
    autodeploy: flags.boolean({
      description: 'autodeploy the review app',
    }),
    autodestroy: flags.boolean({
      description: 'autodestroy the review app',
    }),
    pipeline: flags.string({
      char: 'p',
      description: 'name of pipeline',
      required: true,
    }),
    remote: flags.remote(),
    'wait-for-ci': flags.boolean({
      description: 'wait for CI to pass before deploying',
    }),
  }

  async run() {
    const {flags} = await this.parse(ReviewappsEnable)

    if (flags.app) {
      // remove app & remote flags when Review Apps 1.0 is deprecated
      this.warn('Specifying an app via --app or --remote is no longer needed with Review Apps')
    }

    const settings: {
      automatic_review_apps?: boolean;
      destroy_stale_apps?: boolean;
      pipeline?: string;
      repo?: string;
      wait_for_ci?: boolean;
    } = {
      automatic_review_apps: undefined,
      destroy_stale_apps: undefined,
      pipeline: undefined,
      repo: undefined,
      wait_for_ci: undefined,
    }

    if (flags.autodeploy) {
      ux.stdout('Enabling auto deployment...')
      settings.automatic_review_apps = true
    }

    if (flags.autodestroy) {
      ux.stdout('Enabling auto destroy...')
      settings.destroy_stale_apps = true
    }

    if (flags['wait-for-ci']) {
      ux.stdout('Enabling wait for CI...')
      settings.wait_for_ci = true
    }

    const kolkrabbi = new KolkrabbiAPI(this.config.userAgent, () => this.heroku.auth)

    ux.action.start('Configuring pipeline')

    const {body: pipeline} = await this.heroku.get<Heroku.Pipeline>(`/pipelines/${flags.pipeline}`)

    settings.pipeline = pipeline.id

    try {
      const {body: feature} = await this.heroku.get<Heroku.AccountFeature>('/account/features/dashboard-repositories-api')

      if (feature.enabled) {
        const {body: repo} = await this.heroku.get<{full_name: string}>(`/pipelines/${pipeline.id}/repo`, {
          headers: {Accept: 'application/vnd.heroku+json; version=3.repositories-api'},
        })
        settings.repo = repo.full_name
      }
    } catch {
      const {repository} = await kolkrabbi.getPipelineRepository(pipeline.id)
      settings.repo = repository.name
    }

    if (flags.autodeploy || flags.autodestroy || flags['wait-for-ci']) {
      await this.heroku.patch(`/pipelines/${pipeline.id}/review-app-config`, {
        body: settings,
        headers: {Accept: 'application/vnd.heroku+json; version=3.review-apps'},
      })
    } else {
      // if no flags are passed then the user is enabling review apps
      await this.heroku.post(`/pipelines/${pipeline.id}/review-app-config`, {
        body: settings,
        headers: {Accept: 'application/vnd.heroku+json; version=3.review-apps'},
      })
    }

    ux.action.stop()
  }
}
