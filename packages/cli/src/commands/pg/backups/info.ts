import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import pgHost from '../../../lib/pg/host'
import pgBackupsApi, {BackupTransfer} from '../../../lib/pg/backups'
import {sortBy} from 'lodash'

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
    };

    static args = {
      backup_id: Args.string(),
    };

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Info)
      const {app} = flags
      const {backup_id} = args

      const getBackup = async (id: string | undefined) => {
        let backupID
        if (id) {
          backupID = await pgBackupsApi(app, this.heroku).transfer.num(id)
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

      const displayBackup = (backup: BackupTransfer) => {
        ux.styledHeader(`Backup ${color.cyan(pgBackupsApi(app, this.heroku).transfer.name(backup))}`)
        ux.styledObject({
          Database: color.green(backup.from_name),
          'Started at': backup.started_at,
          'Finished at': backup.finished_at,
          Status: status(backup),
          Type: backup.schedule ? 'Scheduled' : 'Manual', 'Original DB Size': pgBackupsApi(app, this.heroku).filesize(backup.source_bytes),
          'Backup Size': `${pgBackupsApi(app, this.heroku).filesize(backup.processed_bytes)}${backup.finished_at ? compression(backup.processed_bytes, backup.source_bytes) : ''}`,
        }, ['Database', 'Started at', 'Finished at', 'Status', 'Type', 'Original DB Size', 'Backup Size'])
        ux.log()
      }

      const displayLogs = (backup: BackupTransfer) => {
        ux.styledHeader('Backup Logs')
        for (const log of backup.logs)
          ux.log(`${log.created_at} ${log.message}`)
        ux.log()
      }

      const backup = await getBackup(backup_id)
      displayBackup(backup)
      displayLogs(backup)
    }
}
