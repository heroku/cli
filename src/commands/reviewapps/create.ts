import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HTTPError} from '@heroku/http-call'
import {ux} from '@oclif/core/ux'

import notify from '../../lib/notify.js'
import disambiguate from '../../lib/pipelines/disambiguate.js'
import createReviewApp from '../../lib/reviewapps/create-review-app.js'
import {parseWaitInterval} from '../../lib/reviewapps/wait-review-app.js'

export default class ReviewappsCreate extends Command {
  static description = 'create a review app from a pipeline\'s connected repository'
  static examples = [
    color.command('heroku reviewapps:create -p my-pipeline -b my-branch --wait'),
  ]
  static flags = {
    branch: flags.string({
      char: 'b',
      description: 'branch to create the review app from',
      required: true,
    }),
    pipeline: flags.string({
      char: 'p',
      description: 'name of pipeline',
      required: true,
    }),
    wait: flags.boolean({
      description: 'watch review app creation status and exit when complete',
    }),
    'wait-interval': flags.string({
      description: 'how frequently to poll in seconds (use with --wait)',
    }),
  }
  public static notifier: (subtitle: string, message: string, success?: boolean) => void = notify

  async run() {
    const {flags} = await this.parse(ReviewappsCreate)

    const interval = parseWaitInterval(flags['wait-interval'])

    const pipeline = await disambiguate(this.heroku, flags.pipeline)

    ux.action.start(`Creating review app from ${color.cyan(flags.branch)}`)

    // Fail fast if the branch doesn't exist in the pipeline's connected repo.
    try {
      await this.heroku.get(`/pipelines/${pipeline.id}/repo/branches/${encodeURIComponent(flags.branch)}`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.repositories-api'},
      })
    } catch (error: unknown) {
      ux.action.stop(color.red('!'))
      if ((error as HTTPError)?.http?.statusCode !== 404) throw error
      throw new Error(`The branch ${color.cyan(flags.branch)} doesn't exist. Make sure the branch is correct and try again.`)
    }

    try {
      await createReviewApp(this.heroku, pipeline.id!, flags.branch, 'resolve', flags.wait, interval)
      if (flags.wait) {
        ReviewappsCreate.notifier(`heroku reviewapps:create ${flags.branch}`, 'Successfully created the review app.')
      }
    } catch (error) {
      if (flags.wait) {
        ReviewappsCreate.notifier(`heroku reviewapps:create ${flags.branch}`, 'Failed to create the review app.', false)
      }

      throw error
    }
  }
}
