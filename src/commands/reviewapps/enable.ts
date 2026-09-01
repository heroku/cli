import {Command, flags, vars} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {reviewAppConfigExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

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

    const sdk = new HerokuSDK({
      clientOptions: {token: this.heroku.auth},
      clientOptionsByService: {
        platform: {baseUrl: vars.apiUrl},
        repositoriesApi: {baseUrl: vars.apiUrl},
      },
      extensions: [reviewAppConfigExtensions],
    })

    ux.action.start('Configuring pipeline')

    const pipeline = await sdk.platform.pipeline.info(flags.pipeline)
    const pipelineId = pipeline.id!
    const repo = await sdk.platform.reviewAppConfig.resolveRepoName(pipelineId)
    const requestBody = {...settings, pipeline: pipelineId, repo}

    if (flags.autodeploy || flags.autodestroy || flags['wait-for-ci']) {
      const result = await sdk.platform.reviewAppConfig.update(pipelineId, requestBody)
      ux.action.stop()
      return result
    }

    // if no flags are passed then the user is enabling review apps
    const result = await sdk.platform.reviewAppConfig.enable(pipelineId, requestBody)
    ux.action.stop()
    return result
  }
}
