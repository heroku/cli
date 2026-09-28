import type {TransferInfoByAppResult} from '@heroku/types/data'

import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

import * as pgBackups from '../../../lib/pg/backups.js'

type Data = HerokuSDK['data']

function status(backup: TransferInfoByAppResult) {
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

function compression(compressed: null | number, total: null | number) {
  if (compressed === null || total === null) return ''

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
  displayBackup = (backup: TransferInfoByAppResult) => {
    hux.styledHeader(`Backup ${color.name(pgBackups.name(backup))}`)
    /* eslint-disable perfectionist/sort-objects */
    hux.styledObject({
      Database: backup.from_name ? color.datastore(backup.from_name) : 'UNKNOWN',
      'Started at': backup.started_at,
      'Finished at': backup.finished_at,
      Status: status(backup),
      Type: backup.schedule ? 'Scheduled' : 'Manual', 'Original DB Size': pgBackups.filesize(backup.source_bytes ?? null),
      'Backup Size': `${pgBackups.filesize(backup.processed_bytes)}${backup.finished_at ? compression(backup.processed_bytes, backup.source_bytes ?? null) : ''}`,
    }, ['Database', 'Started at', 'Finished at', 'Status', 'Type', 'Original DB Size', 'Backup Size'])
    /* eslint-enable perfectionist/sort-objects */
    ux.stdout('\n')
  }
  displayLogs = (backup: TransferInfoByAppResult) => {
    hux.styledHeader('Backup Logs')
    for (const log of backup.logs || [])
      ux.stdout(`${log.created_at} ${log.message}\n`)
    ux.stdout('\n')
  }
  getBackup = async (id: string | undefined, app: string, data: Data) : Promise<TransferInfoByAppResult> => {
    let backupID
    if (id) {
      backupID = await pgBackups.num(id, app, data)
      if (!backupID)
        throw new Error(`Invalid ID: ${id}`)
    } else {
      const transfers = await data.transfer.listByApp(app)
      transfers.sort((a, b) => a.created_at.localeCompare(b.created_at))
      const backups = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'gof3r')
      const lastBackup = backups.pop()
      if (!lastBackup)
        throw new Error(`No backups. Capture one with ${color.code('heroku pg:backups:capture')}`)
      backupID = lastBackup.num
    }

    const backup = await data.transfer.infoByApp(app, String(backupID), {verbose: true})
    return backup
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Info)
    const {app} = flags
    const {backup_id} = args
    const {data} = new HerokuSDK()

    const backup = await this.getBackup(backup_id, app, data)
    this.displayBackup(backup)
    this.displayLogs(backup)
  }
}
