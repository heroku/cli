'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const pgbackups = require('../../lib/pgbackups')(context, heroku)
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')

  const {app, args, flags} = context
  const interval = Math.max(3, parseInt(flags['wait-interval'])) || 3
  const db = yield fetcher.addon(app, args.database)

  let backup
  yield cli.action(`Starting backup of ${cli.color.addon(db.name)}`, co(function * () {
    backup = yield heroku.post(`/client/v11/databases/${db.name}/backups`, {host: host(db)})
  }))
  cli.log(`
Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
Use ${cli.color.cmd('heroku pg:backups:info')} to check progress.
Stop a running backup with ${cli.color.cmd('heroku pg:backups:cancel')}.
`)

  yield pgbackups.wait(`Backing up ${cli.color.configVar(backup.from_name)} to ${cli.color.cyan(pgbackups.transfer.name(backup))}`, backup.uuid, interval, flags.verbose)
}

module.exports = {
  topic: 'pg',
  command: 'backups:capture',
  description: 'capture a new backup',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [
    {name: 'wait-interval', hasValue: true},
    {name: 'verbose', char: 'v'}
  ],
  run: cli.command({preauth: true}, co.wrap(run))
}
