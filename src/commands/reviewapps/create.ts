import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'
import tsheredoc from 'tsheredoc'

import notify from '../../lib/notify.js'
import disambiguate from '../../lib/pipelines/disambiguate.js'
import createReviewApp from '../../lib/reviewapps/create-review-app.js'
import {parseWaitInterval} from '../../lib/reviewapps/wait-review-app.js'

const heredoc = tsheredoc.default

export default class ReviewappsCreate extends Command {
  static description = heredoc`
    Create a new review app for a pipeline branch.

    The branch must exist in the pipeline's connected GitHub repository.
  `
  static examples = [
    color.command('heroku reviewapps:create -p my-pipeline -b my-branch --wait'),
  ]
  static flags = {
    branch: flags.string({
      char: 'b',
      description: 'the branch to create the review app from',
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
      description: 'how frequently to poll in seconds (to use with --wait)',
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
    } catch (error: any) {
      ux.action.stop(color.red('!'))
      if (error?.http?.statusCode !== 404) throw error
      throw new Error('Branch not found')
    }

    try {
      await createReviewApp(this.heroku, pipeline.id!, flags.branch, 'resolve', flags.wait, interval)
      if (flags.wait) {
        ReviewappsCreate.notifier(`heroku reviewapps:create ${flags.branch}`, 'Review app successfully created')
      }
    } catch (error) {
      if (flags.wait) {
        ReviewappsCreate.notifier(`heroku reviewapps:create ${flags.branch}`, 'Review app failed to be created', false)
      }

      throw error
    }
  }
}
