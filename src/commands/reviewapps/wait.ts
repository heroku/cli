import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'

import notify from '../../lib/notify.js'
import {parseWaitInterval, REVIEW_APP_ACCEPT, waitForReviewApp} from '../../lib/reviewapps/wait-review-app.js'
import {ReviewApp} from '../../lib/types/fir.js'

export default class Wait extends Command {
  static args = {
    app: Args.string({description: 'unique identifier or name of the app', required: true}),
  }
  static description = 'wait for a review app to be created'
  static flags = {
    'wait-interval': flags.string({description: 'how frequently to poll in seconds'}),
  }
  public static notifier: (subtitle: string, message: string, success?: boolean) => void = notify
  static topic = 'reviewapps'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Wait)

    const {body: reviewApp} = await this.heroku.get<ReviewApp>(`/apps/${args.app}/review-app`, {
      headers: {Accept: REVIEW_APP_ACCEPT},
    })

    const interval = parseWaitInterval(flags['wait-interval'])

    const startTime = new Date()
    // Only notify if we actually waited at least one poll interval; a review app
    // in a terminal status returns immediately and needs no notification.
    const waited = () => Date.now() - startTime.valueOf() >= interval * 1000
    try {
      await waitForReviewApp(this.heroku, reviewApp, interval, args.app, 'Review app is building and will be ready when complete')
    } catch (error) {
      if (waited()) {
        Wait.notifier(`heroku reviewapps:wait ${args.app}`, 'Review app failed to be created', false)
      }

      throw error
    }

    if (waited()) {
      Wait.notifier(`heroku reviewapps:wait ${args.app}`, 'Review app successfully created')
    }
  }
}
