'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function dropboxURL (url) {
  // Force a dump file to download instead of rendering as HTML
  // file by specifying the dl=1 param for Dropbox URL
  if (url.match(/^https?:\/\/www\.dropbox\.com/) && !url.endsWith('dl=1')) {
    if (url.endsWith('dl=0')) url = url.replace('dl=0', 'dl=1')
    else if (url.includes('?')) url += '&dl=1'
    else url += '?dl=1'
  }
  return url
}

function * run (context, heroku) {
  const pgbackups = require('../../lib/pgbackups')(context, heroku)
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const { sortBy } = require('lodash')

  const { app, args, flags } = context
  const interval = Math.max(3, parseInt(flags['wait-interval'])) || 3
  const db = yield fetcher.addon(app, args.database)

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
    let transfers = yield heroku.get(`/client/v11/apps/${backupApp}/transfers`, { host: host() })
    let backups = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'gof3r')
    let backup
    if (backupName) {
      backup = backups.find(b => pgbackups.transfer.name(b) === backupName)
      if (!backup) throw new Error(`Backup ${cli.color.cyan(backupName)} not found for ${cli.color.app(backupApp)}`)
      if (!backup.succeeded) throw new Error(`Backup ${cli.color.cyan(backupName)} for ${cli.color.app(backupApp)} did not complete successfully`)
    } else {
      backup = sortBy(backups.filter(b => b.succeeded), 'finished_at').pop()
      if (!backup) throw new Error(`No backups for ${cli.color.app(backupApp)}. Capture one with ${cli.color.cmd('heroku pg:backups:capture')}`)
      backupName = pgbackups.transfer.name(backup)
    }
    backupURL = backup.to_url
  }

  yield cli.confirmApp(app, flags.confirm)
  let restore
  yield cli.action(`Starting restore of ${cli.color.cyan(backupName)} to ${cli.color.addon(db.name)}`, co(function * () {
    restore = yield heroku.post(`/client/v11/databases/${db.id}/restores`, {
      body: { backup_url: backupURL },
      host: host(db)
    })
  }))
  cli.log(`
Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
Use ${cli.color.cmd('heroku pg:backups')} to check progress.
Stop a running restore with ${cli.color.cmd('heroku pg:backups:cancel')}.
`)

  yield pgbackups.wait('Restoring', restore.uuid, interval, flags.verbose, db.app.name)
}

module.exports = {
  topic: 'pg',
  command: 'backups:restore',
  description: 'restore a backup (default latest) to a database',
  help: 'defaults to saving the latest database to DATABASE_URL',
  needsApp: true,
  needsAuth: true,
  args: [
    { name: 'backup', optional: true },
    { name: 'database', optional: true }
  ],
  flags: [
    { name: 'wait-interval', hasValue: true },
    { name: 'verbose', char: 'v' },
    { name: 'confirm', char: 'c', hasValue: true }
  ],
  run: cli.command({ preauth: true }, co.wrap(run))
}
