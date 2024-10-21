import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import confirmCommand from '../../../lib/confirmCommand'
import backupsFactory from '../../../lib/pg/backups'
import {getAttachment} from '../../../lib/pg/fetcher'
import host from '../../../lib/pg/host'
import type {BackupTransfer} from '../../../lib/pg/types'

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
  static topic = 'pg'
  static description = 'restore a backup (default latest) to a database'
  static flags = {
    'wait-interval': flags.integer({default: 3}),
    extensions: flags.string({
      char: 'e',
      description: heredoc(`
      comma-separated list of extensions to pre-install in the public schema
      defaults to saving the latest database to DATABASE_URL
      `),
    }),
    verbose: flags.boolean({char: 'v'}),
    confirm: flags.string({char: 'c'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    backup: Args.string({description: 'The backup location to restore. Can be a URL or a backup from another app.'}),
    database: Args.string({description: 'The config var exposed to the owning app containing the database configuration.'}),
  }

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

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Restore)
    const {app, 'wait-interval': waitInterval, extensions, confirm, verbose} = flags
    const interval = Math.max(3, waitInterval)
    const {addon: db} = await getAttachment(this.heroku, app as string, args.database)
    const {name, wait} = backupsFactory(app, this.heroku)
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

      const {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${backupApp}/transfers`, {hostname: host()})
      const backups = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'gof3r')

      let backup
      if (backupName) {
        backup = backups.find(b => name(b) === backupName)
        if (!backup)
          throw new Error(`Backup ${color.cyan(backupName)} not found for ${color.app(backupApp)}`)
        if (!backup.succeeded)
          throw new Error(`Backup ${color.cyan(backupName)} for ${color.app(backupApp)} did not complete successfully`)
      } else {
        backup = backups.filter(b => b.succeeded).sort((a, b) => {
          if (a.finished_at < b.finished_at) {
            return -1
          }

          if (a.finished_at > b.finished_at) {
            return 1
          }

          return 0
        }).pop()
        if (!backup) {
          throw new Error(`No backups for ${color.app(backupApp)}. Capture one with ${color.cyan.bold('heroku pg:backups:capture')}`)
        }

        backupName = name(backup)
      }

      backupURL = backup.to_url
    }

    await confirmCommand(app, confirm)
    ux.action.start(`Starting restore of ${color.cyan(backupName)} to ${color.yellow(db.name)}`)
    ux.log(heredoc(`

    Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
    Use ${color.cyan.bold('heroku pg:backups')} to check progress.
    Stop a running restore with ${color.cyan.bold('heroku pg:backups:cancel')}.
    `))

    const {body: restore} = await this.heroku.post<{uuid: string}>(`/client/v11/databases/${db.id}/restores`, {
      body: {backup_url: backupURL, extensions: this.getSortedExtensions(extensions as string)}, hostname: host(),
    })

    ux.action.stop()
    await wait('Restoring', restore.uuid, interval, verbose, db.app.id as string)
  }

  protected getSortedExtensions(extensions: string | null | undefined): string[] | undefined {
    return extensions?.split(',').map(ext => ext.trim().toLowerCase()).sort()
  }
}
