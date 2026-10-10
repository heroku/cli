import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {NotFoundError} from '@heroku/heroku-fetch'
import {HerokuSDK} from '@heroku/sdk'
import {backupExtensions, databaseExtensions, TransferFailedError} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import * as pgBackups from '../../../lib/pg/backups.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc

export default class Capture extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'capture a new backup'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    verbose: flags.boolean({char: 'v'}),
    'wait-interval': flags.string(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Capture)
    const {app, verbose, 'wait-interval': waitInterval} = flags
    const {database} = args

    const interval = Math.max(3, Number.parseInt(waitInterval || '3', 10))
    const {data} = new HerokuSDK({extensions: [backupExtensions, databaseExtensions]})

    try {
      const dbInfo = await data.database.describe(app, database)
      const dbProtected = /On/.test(String(dbInfo.info?.find(attribute => attribute.name === 'Continuous Protection')?.values?.[0]))
      if (dbProtected) {
        ux.warn('Continuous protection is already enabled for this database. Logical backups of large databases are likely to fail.')
        ux.warn('See https://devcenter.heroku.com/articles/heroku-postgres-data-safety-and-continuous-protection#physical-backups-on-heroku-postgres.')
      }
    } catch (error) {
      if (!(error instanceof NotFoundError))
        throw error
      ux.error(
        heredoc`
          ${color.datastore(database ?? 'DATABASE_URL')} is not yet provisioned.
          Run ${color.code('heroku addons:wait')} to wait until the db is provisioned.
        `,
        {exit: 1},
      )
    }

    const waitOptions = pgBackups.constructWaitOptions(interval, verbose, backup => `Backing up ${backup.from_name ? color.datastore(backup.from_name) : 'UNKNOWN'} to ${color.cyan(pgBackups.name(backup))}`)

    try {
      await data.backup.captureAndWait(app, database, {
        capturePoller: {
          onStart(db) {
            ux.action.start(`Starting backup of ${color.datastore(db.name)}`)
          },
          onStop(db) {
            ux.action.stop()
            ux.stdout(heredoc`

              Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
              Use ${color.code('heroku pg:backups:info')} to check progress.
              Stop a running backup with ${color.code('heroku pg:backups:cancel')}.
            `)

            if (app !== db.app.name) {
              ux.stdout(heredoc`
                HINT: You are running this command with a non-billing application.
                Use ${color.code('heroku pg:backups -a ' + db.app.name)} to check the list of backups.
              `)
            }
          },
        },
        verbose,
        ...waitOptions,
      })
    } catch (error) {
      if (!(error instanceof TransferFailedError)) throw error
      pgBackups.reportTransferFailure(error, 'backup')
    }
  }
}
