'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const host = require('../../lib/host')()
  const pgbackups = require('../../lib/pgbackups')(context, heroku)

  const { app, args, flags } = context

  yield cli.confirmApp(app, flags.confirm)

  yield cli.action(`Deleting backup ${cli.color.cyan(args.backup_id)} on ${cli.color.app(app)}`, co(function * () {
    let num = yield pgbackups.transfer.num(args.backup_id)
    if (!num) throw new Error(`Invalid Backup: ${args.backup_id}`)

    yield heroku.delete(`/client/v11/apps/${app}/transfers/${num}`, { host })
  }))
}

module.exports = {
  topic: 'pg',
  command: 'backups:delete',
  description: 'delete a backup',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'backup_id' }],
  flags: [{ name: 'confirm', char: 'c', hasValue: true }],
  run: cli.command({ preauth: true }, co.wrap(run))
}
