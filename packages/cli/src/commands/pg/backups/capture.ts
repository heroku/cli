import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import backupsApi from '../../../lib/pg/backups'
import {BackupTransfer, PgDatabase} from '../../../lib/pg/types'
import {getAddon} from '../../../lib/pg/fetcher'
import pgHost from '../../../lib/pg/host'
import heredoc from 'tsheredoc'
import {HTTPError} from 'http-call'
import {nls} from '../../../nls'

export default class Capture extends Command {
  static topic = 'pg';
  static description = 'capture a new backup';
  static flags = {
    'wait-interval': flags.string(),
    verbose: flags.boolean({char: 'v'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Capture)
    const {app, 'wait-interval': waitInterval, verbose} = flags
    const {database} = args

    const interval = Math.max(3, Number.parseInt(waitInterval || '3', 10))
    const db = await getAddon(this.heroku, app, database)
    const pgBackupsApi = backupsApi(app, this.heroku)

    try {
      const {body: dbInfo} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: pgHost()})
      const dbProtected = /On/.test(dbInfo.info.find(attribute => attribute.name === 'Continuous Protection')?.values[0] || '')
      if (dbProtected) {
        ux.warn('Continuous protection is already enabled for this database. Logical backups of large databases are likely to fail.')
        ux.warn('See https://devcenter.heroku.com/articles/heroku-postgres-data-safety-and-continuous-protection#physical-backups-on-heroku-postgres.')
      }
    } catch (error: unknown) {
      const httpError = error as HTTPError
      if (httpError.statusCode !== 404)
        throw httpError
      ux.error(
        heredoc`
          ${color.yellow(db.name)} is not yet provisioned.
          Run ${color.cmd('heroku addons:wait')} to wait until the db is provisioned.
        `,
        {exit: 1},
      )
    }

    ux.action.start(`Starting backup of ${color.yellow(db.name)}`)
    const {body: backup} = await this.heroku.post<BackupTransfer>(`/client/v11/databases/${db.id}/backups`, {hostname: pgHost()})
    ux.action.stop()
    ux.log(heredoc`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
      Use ${color.cmd('heroku pg:backups:info')} to check progress.
      Stop a running backup with ${color.cmd('heroku pg:backups:cancel')}.
    `)

    if (app !== db.app.name) {
      ux.log(heredoc`
        HINT: You are running this command with a non-billing application.
        Use ${color.cmd('heroku pg:backups -a ' + db.app.name)} to check the list of backups.
      `)
    }

    await pgBackupsApi.wait(`Backing up ${color.green(backup.from_name)} to ${color.cyan(pgBackupsApi.name(backup))}`, backup.uuid, interval, verbose, db.app.name || app)
  }
}
