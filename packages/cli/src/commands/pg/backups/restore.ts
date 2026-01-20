import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import type {BackupTransfer} from '../../../lib/pg/types.js'

import ConfirmCommand from '../../../lib/confirmCommand.js'
import backupsFactory from '../../../lib/pg/backups.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc.default

function dropboxURL(url: string) {
  if (url.match(/^https?:\/\/www\.dropbox\.com/) && !url.endsWith('dl=1')) {
    if (url.endsWith('dl=0'))
      url = url.replace('dl=0', 'dl=1')
    else if (url.includes('?'))
      url += '&dl=1'
    else
      url += '?dl=1'
  }

  return url
}

export default class Restore extends Command {
  static args = {
    backup: Args.string({description: 'URL or backup ID from another app'}),
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  static description = 'restore a backup (default latest) to a database'

  static examples = [
    heredoc(`
    # Basic Restore from Backup ID
    $ heroku pg:backups:restore b101 DATABASE_URL --app my-heroku-app
    `),
    heredoc(`
    # Restore from Another App
    $ heroku pg:backups:restore example-app::b101 DATABASE_URL --app my-heroku-app
    `),
    heredoc(`
    # Restore from a Public URL
    $ heroku pg:backups:restore 'https://s3.amazonaws.com/my-bucket/mydb.dump' DATABASE_URL --app my-heroku-app
    `),
    heredoc(`
    # Verbose Output
    $ heroku pg:backups:restore b101 DATABASE_URL --app my-heroku-app --verbose
    `),
    heredoc(`
    # Restore with Confirmation Prompt
    $ heroku pg:backups:restore b101 DATABASE_URL --app my-heroku-app --confirm my-heroku-app
    `),
    heredoc(`
    # Restore with a Specific Database Name
    $ heroku pg:backups:restore b101 HEROKU_POSTGRESQL_PINK --app my-heroku-app
    `),
  ]

  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    extensions: flags.string({
      char: 'e',
      description: heredoc(`
        comma-separated list of extensions to pre-install in the default
        public schema or an optional custom schema
        (for example: hstore or myschema.hstore)
      `),
    }),
    remote: flags.remote(),
    verbose: flags.boolean({char: 'v'}),
    'wait-interval': flags.integer({default: 3}),
  }

  static topic = 'pg'

  protected getSortedExtensions(extensions: null | string | undefined): string[] | undefined {
    return extensions?.split(',').map(ext => ext.trim().toLowerCase()).sort()
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Restore)
    const {app, confirm, extensions, verbose, 'wait-interval': waitInterval} = flags
    const interval = Math.max(3, waitInterval)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app as string, args.database)
    const pgbackups = backupsFactory(app, this.heroku)
    let backupURL
    let backupName = args.backup

    if (backupName && backupName.match(/^https?:\/\//)) {
      backupURL = dropboxURL(backupName)
    } else {
      let backupApp
      if (backupName && backupName.match(/::/)) {
        [backupApp, backupName] = backupName.split('::')
      } else {
        backupApp = app
      }

      const {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${backupApp}/transfers`, {hostname: utils.pg.host()})
      const backups = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'gof3r')

      let backup
      if (backupName) {
        backup = backups.find(b => pgbackups.name(b) === backupName)
        if (!backup)
          throw new Error(`Backup ${color.cyan(backupName)} not found for ${color.app(backupApp)}`)
        if (!backup.succeeded)
          throw new Error(`Backup ${color.cyan(backupName)} for ${color.app(backupApp)} did not complete successfully`)
      } else {
        backup = backups.filter(b => b.succeeded).sort((a, b) => {
          if (a.finished_at && b.finished_at) {
            return a.finished_at.localeCompare(b.finished_at)
          }

          if (a.finished_at) return 1
          if (b.finished_at) return -1
          return 0
        }).pop()
        if (!backup) {
          throw new Error(`No backups for ${color.app(backupApp)}. Capture one with ${color.cyan.bold('heroku pg:backups:capture')}`)
        }

        backupName = pgbackups.name(backup)
      }

      backupURL = backup.to_url
    }

    const confirmCmd = new ConfirmCommand()
    await confirmCmd.confirm(app, confirm)
    ux.action.start(`Starting restore of ${color.cyan(backupName)} to ${color.datastore(db.name)}`)
    ux.stdout(heredoc(`

    Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
    Use ${color.cyan.bold('heroku pg:backups')} to check progress.
    Stop a running restore with ${color.cyan.bold('heroku pg:backups:cancel')}.
    `))

    const {body: restore} = await this.heroku.post<{uuid: string}>(`/client/v11/databases/${db.id}/restores`, {
      body: {backup_url: backupURL, extensions: this.getSortedExtensions(extensions as string)}, hostname: utils.pg.host(),
    })

    ux.action.stop()
    await pgbackups.wait('Restoring', restore.uuid, interval, verbose, db.app.id as string)
  }
}

