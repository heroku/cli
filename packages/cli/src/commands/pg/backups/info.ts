
import {color, hux, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import type {BackupTransfer} from '../../../lib/pg/types.js'

import pgBackupsApi from '../../../lib/pg/backups.js'

function status(backup: BackupTransfer) {
  if (backup.succeeded) {
    if (backup.warnings > 0)
      return `Finished with ${backup.warnings} warnings`
    return 'Completed'
  }

  if (backup.canceled_at)
    return 'Canceled'
  if (backup.finished_at)
    return 'Failed'
  if (backup.started_at)
    return 'Running'
  return 'Pending'
}

function compression(compressed: number, total: number) {
  let pct = 0
  if (compressed > 0) {
    pct = Math.round((total - compressed) / total * 100)
    pct = Math.max(0, pct)
  }

  return ` (${pct}% compression)`
}

export default class Info extends Command {
  static args = {
    backup_id: Args.string({description: 'ID of the backup. If omitted, we use the last backup ID.'}),
  }

  static description = 'get information about a specific backup'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  displayBackup = (backup: BackupTransfer, app: string) => {
    const pgbackups = pgBackupsApi(app, this.heroku)
    hux.styledHeader(`Backup ${color.cyan(pgbackups.name(backup))}`)
    /* eslint-disable perfectionist/sort-objects */
    hux.styledObject({
      Database: color.datastore(backup.from_name),
      'Started at': backup.started_at,
      'Finished at': backup.finished_at,
      Status: status(backup),
      Type: backup.schedule ? 'Scheduled' : 'Manual', 'Original DB Size': pgbackups.filesize(backup.source_bytes),
      'Backup Size': `${pgbackups.filesize(backup.processed_bytes)}${backup.finished_at ? compression(backup.processed_bytes, backup.source_bytes) : ''}`,
    }, ['Database', 'Started at', 'Finished at', 'Status', 'Type', 'Original DB Size', 'Backup Size'])
    /* eslint-enable perfectionist/sort-objects */
    ux.stdout('\n')
  }

  displayLogs = (backup: BackupTransfer) => {
    hux.styledHeader('Backup Logs')
    for (const log of backup.logs)
      ux.stdout(`${log.created_at} ${log.message}\n`)
    ux.stdout('\n')
  }

  getBackup = async (id: string | undefined, app: string) => {
    let backupID
    if (id) {
      const pgbackups = pgBackupsApi(app, this.heroku)
      backupID = await pgbackups.num(id)
      if (!backupID)
        throw new Error(`Invalid ID: ${id}`)
    } else {
      const {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${app}/transfers`, {hostname: utils.pg.host()})
      transfers.sort((a, b) => a.created_at.localeCompare(b.created_at))
      const backups = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'gof3r')
      const lastBackup = backups.pop()
      if (!lastBackup)
        throw new Error(`No backups. Capture one with ${color.cyan.bold('heroku pg:backups:capture')}`)
      backupID = lastBackup.num
    }

    const {body: backup} = await this.heroku.get<BackupTransfer>(`/client/v11/apps/${app}/transfers/${backupID}?verbose=true`, {hostname: utils.pg.host()})
    return backup
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Info)
    const {app} = flags
    const {backup_id} = args

    const backup = await this.getBackup(backup_id, app)
    this.displayBackup(backup, app)
    this.displayLogs(backup)
  }
}

