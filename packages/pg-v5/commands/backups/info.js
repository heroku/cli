'use strict'

const cli = require('heroku-cli-util')

function status (backup) {
  if (backup.succeeded) {
    if (backup.warnings > 0) return `Finished with ${backup.warnings} warnings`
    else return 'Completed'
  }
  if (backup.canceled_at) return 'Canceled'
  if (backup.finished_at) return 'Failed'
  if (backup.started_at) return 'Running'
  return 'Pending'
}

function compression (compressed, total) {
  let pct = 0
  if (compressed > 0) {
    pct = Math.round((total - compressed) / total * 100.0)
    pct = Math.max(0, pct)
  }
  return ` (${pct}% compression)`
}

async function run(context, heroku) {
  const pgbackups = require('../../lib/pgbackups')(context, heroku)
  const { sortBy } = require('lodash')
  const host = require('../../lib/host')()
  const app = context.app

  let getBackup = async function (id) {
    let backupID
    if (id) {
      backupID = await pgbackups.transfer.num(id)
      if (!backupID) throw new Error(`Invalid ID: ${id}`)
    } else {
      let transfers = await heroku.get(`/client/v11/apps/${app}/transfers`, { host })
      transfers = sortBy(transfers, 'created_at')
      let backups = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'gof3r')
      let lastBackup = backups.pop()
      if (!lastBackup) throw new Error(`No backups. Capture one with ${cli.color.cmd('heroku pg:backups:capture')}`)
      backupID = lastBackup.num
    }
    return await heroku.get(`/client/v11/apps/${app}/transfers/${backupID}?verbose=true`, { host });
  }

  let displayBackup = backup => {
    cli.styledHeader(`Backup ${cli.color.cyan(pgbackups.transfer.name(backup))}`)
    cli.styledObject({
      'Database': cli.color.configVar(backup.from_name),
      'Started at': backup.started_at,
      'Finished at': backup.finished_at,
      'Status': status(backup),
      'Type': backup.schedule ? 'Scheduled' : 'Manual',
      'Original DB Size': pgbackups.filesize(backup.source_bytes),
      'Backup Size': `${pgbackups.filesize(backup.processed_bytes)}${backup.finished_at ? compression(backup.processed_bytes, backup.source_bytes) : ''}`
    }, ['Database', 'Started at', 'Finished at', 'Status', 'Type', 'Original DB Size', 'Backup Size'])
    cli.log()
  }

  let displayLogs = backup => {
    cli.styledHeader('Backup Logs')
    for (let log of backup.logs) cli.log(`${log.created_at} ${log.message}`)
    cli.log()
  }

  let backup = await getBackup(context.args.backup_id)
  displayBackup(backup)
  displayLogs(backup)
}

module.exports = {
  topic: 'pg',
  command: 'backups:info',
  description: 'get information about a specific backup',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'backup_id', optional: true }],
  run: cli.command({ preauth: true }, run)
}
