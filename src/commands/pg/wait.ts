import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {LegacyDatabaseWaitError, legacyDatabaseWaitExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

import notify from '../../lib/notify.js'
import {createSDK} from '../../lib/sdk.js'
import {nls} from '../../nls.js'

export default class Wait extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:all-dbs:suffix')}`}),
  }
  static description = 'blocks until database is available'
  static flags = {
    app: flags.app({required: true}),
    'no-notify': flags.boolean({description: 'do not show OS notification'}),
    remote: flags.remote(),
    'wait-interval': flags.string({description: 'how frequently to poll in seconds (to avoid rate limiting)'}),
  }
  public static notifier: (subtitle: string, message: string, success?: boolean) => void = notify
  static topic = 'pg'

  public async run() {
    const {args, flags} = await this.parse(Wait)
    const {app, 'wait-interval': waitInterval} = flags
    const dbName = args.database

    const {data} = createSDK(this.heroku, {extensions: [legacyDatabaseWaitExtensions]})
    const interval = waitInterval && Number.parseInt(waitInterval, 10)
    const waitIntervalMs = (!interval || interval < 0 ? 5 : interval) * 1000
    let waitingDatabaseId: string | undefined
    let waiting = false

    try {
      const result = await data.database.waitForReadyForApp(app, dbName, {
        onPoll({addon, status}) {
          if (status['error?']) return

          if (waitingDatabaseId !== addon.id) {
            waitingDatabaseId = addon.id
            waiting = false
          }

          if (!status['waiting?']) {
            if (waiting) {
              ux.action.stop(status.message)
            }

            return
          }

          if (!waiting) {
            waiting = true
            ux.action.start(`Waiting for database ${color.yellow(addon.name)}`, status.message)
          }

          ux.action.status = status.message
        },
        waitIntervalMs,
      })

      return result
    } catch (error) {
      if (error instanceof LegacyDatabaseWaitError) {
        Wait.notifier('error', `${error.addon.name} ${error.status.message}`, false)
        ux.error(error.status.message || '', {exit: 1})
      }

      throw error
    }
  }
}
