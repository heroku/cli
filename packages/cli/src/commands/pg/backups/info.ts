import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import pgHost from '../../../lib/pg/host'
import pgBackupsApi from '../../../lib/pg/backups'
import {sortBy} from 'lodash'
import type {BackupTransfer} from '../../../lib/pg/types'

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
  static topic = 'pg';
  static description = 'get information about a specific backup';
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    backup_id: Args.string({description: 'The ID of the backup to get info for. If omitted, the last backup is used.'}),
  };

  getBackup = async (id: string | undefined, app: string) => {
    let backupID
    if (id) {
      const {num} = pgBackupsApi(app, this.heroku)
      backupID = await num(id)
      if (!backupID)
        throw new Error(`Invalid ID: ${id}`)
    } else {
      let {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${app}/transfers`, {hostname: pgHost()})
      transfers = sortBy(transfers, 'created_at')
      const backups = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'gof3r')
      const lastBackup = backups.pop()
      if (!lastBackup)
        throw new Error(`No backups. Capture one with ${color.cyan.bold('heroku pg:backups:capture')}`)
      backupID = lastBackup.num
    }

    const {body: backup} = await this.heroku.get<BackupTransfer>(`/client/v11/apps/${app}/transfers/${backupID}?verbose=true`, {hostname: pgHost()})
    return backup
  }

  displayBackup = (backup: BackupTransfer, app: string) => {
    const {filesize, name} = pgBackupsApi(app, this.heroku)
    ux.styledHeader(`Backup ${color.cyan(name(backup))}`)
    ux.styledObject({
      Database: color.green(backup.from_name),
      'Started at': backup.started_at,
      'Finished at': backup.finished_at,
      Status: status(backup),
      Type: backup.schedule ? 'Scheduled' : 'Manual', 'Original DB Size': filesize(backup.source_bytes),
      'Backup Size': `${filesize(backup.processed_bytes)}${backup.finished_at ? compression(backup.processed_bytes, backup.source_bytes) : ''}`,
    }, ['Database', 'Started at', 'Finished at', 'Status', 'Type', 'Original DB Size', 'Backup Size'])
    ux.log()
  }

  displayLogs = (backup: BackupTransfer) => {
    ux.styledHeader('Backup Logs')
    for (const log of backup.logs)
      ux.log(`${log.created_at} ${log.message}`)
    ux.log()
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Info)
    const {app} = flags
    const {backup_id} = args

    const backup = await this.getBackup(backup_id, app)
    this.displayBackup(backup, app)
    this.displayLogs(backup)
  }
}
