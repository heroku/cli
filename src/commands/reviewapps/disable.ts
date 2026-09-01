import {Command, flags, vars} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {reviewAppConfigExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

export default class ReviewappsDisable extends Command {
  static description = 'disable review apps and/or settings on an existing pipeline'
  static examples = [
    color.command('heroku reviewapps:disable -p my-pipeline -a my-app --no-autodeploy'),
  ]
  static flags = {
    app: flags.app({
      description: 'parent app used by review apps',
    }),
    autodeploy: flags.boolean({
      description: 'disable autodeployments',
      hidden: true,
    }),
    autodestroy: flags.boolean({
      description: 'disable automatically destroying review apps',
      hidden: true,
    }),
    'no-autodeploy': flags.boolean({
      description: 'disable autodeployments',
    }),
    'no-autodestroy': flags.boolean({
      description: 'disable automatically destroying review apps',
    }),
    'no-wait-for-ci': flags.boolean({
      description: 'disable wait for CI',
    }),
    pipeline: flags.pipeline({
      required: true,
    }),
    remote: flags.remote(),
    'wait-for-ci': flags.boolean({
      description: 'disable wait for CI',
      hidden: true,
    }),
  }

  async run() {
    const {flags} = await this.parse(ReviewappsDisable)

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

    // flags.autodeploy are back supported
    if (flags['no-autodeploy'] || flags.autodeploy) {
      ux.stdout('Disabling auto deployment...')
      settings.automatic_review_apps = false
    }

    // flags.autodestroy are back supported
    if (flags['no-autodestroy'] || flags.autodestroy) {
      ux.stdout('Disabling auto destroy...')
      settings.destroy_stale_apps = false
    }

    // flags['wait-for-ci'] are back supported
    if (flags['no-wait-for-ci'] || flags['wait-for-ci']) {
      ux.stdout('Disabling wait for CI...')
      settings.wait_for_ci = false
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

    if (flags.autodeploy || flags['no-autodeploy'] || flags.autodestroy || flags['no-autodestroy'] || flags['wait-for-ci'] || flags['no-wait-for-ci']) {
      const result = await sdk.platform.reviewAppConfig.update(pipelineId, requestBody)
      ux.action.stop()
      return result
    }

    // if no flags are passed then the user is disabling review apps
    const result = await sdk.platform.withOptions({body: requestBody}).reviewAppConfig.delete(pipelineId)
    ux.action.stop()
    return result
  }
}
