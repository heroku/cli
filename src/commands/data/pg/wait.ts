import {flags as Flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {postgresExtensions, type PostgresWaitForReadyResult} from '@heroku/sdk/extensions/data'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../lib/data/base-command.js'
import notify from '../../../lib/notify.js'
import {createSDK} from '../../../lib/sdk.js'

const heredoc = tsheredoc

export default class DataPgWait extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'show status of an operation until it\'s complete'
  static examples = [
    heredoc(`
      # Wait for database to be available
      ${color.code('<%= config.bin %> <%= command.id %> DATABASE --app myapp')}
    `),
  ]
  static flags = {
    app: Flags.app({required: true}),
    'no-notify': Flags.boolean({
      description: 'do not show OS notification',
    }),
    remote: Flags.remote(),
    'wait-interval': Flags.integer({
      default: 5,
      description: 'how frequently to poll in seconds (to avoid rate limiting)',
      min: 1,
    }),
  }
  protected classicWaitCommand: string = 'pg:wait'

  public async notify(...args: Parameters<typeof notify>): Promise<void> {
    return notify(...args)
  }

  public async run(): Promise<PostgresWaitForReadyResult> {
    const {args, flags} = await this.parse(DataPgWait)
    const {database} = args
    const {app, 'no-notify': noNotify, 'wait-interval': waitInterval} = flags

    const {data} = createSDK(this.heroku, {extensions: [postgresExtensions]})

    // `name` is captured from `onResolved` (fired before the first poll) so the
    // spinner and notification can reference the resolved add-on; `waiting`
    // tracks whether we ever started the spinner, mirroring the previous
    // first-poll ("is available.") vs waited ("stop") branches.
    let name = database
    let waiting = false

    try {
      const result = await data.postgres.waitForReady(app, database, {
        onPoll(status) {
          if (!status.waiting) {
            if (waiting) {
              ux.action.stop(status.message || 'available')
            } else {
              ux.stdout(`${color.datastore(name)} is available.`)
            }

            return
          }

          if (!waiting) {
            waiting = true
            ux.action.start(`Waiting for database ${color.addon(name)}`, status.message || undefined)
          }

          ux.action.status = status.message || undefined
        },
        onResolved(addon) {
          name = addon.name
        },
        waitIntervalMs: (waitInterval || 5) * 1000,
      })

      if (!noNotify && waiting) {
        this.notify('heroku data:pg:wait', `Database ${name} is now available`)
      }

      return result
    } catch (error) {
      if (error instanceof NotAdvancedDatabaseError) {
        ux.error(heredoc`
          You can only use this command on Advanced-tier databases.
          Use ${color.code(`heroku ${this.classicWaitCommand} ${error.addon.name} -a ${app}`)} instead.`)
      }

      if (waiting) {
        ux.action.stop(color.red('!'))
      }

      throw error
    }
  }
}
