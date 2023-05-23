'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const pgbackups = require('../../lib/pgbackups')(context, heroku)
  const host = require('../../lib/host')()
  const {sortBy} = require('lodash')

  const {app, args} = context

  let transfer
  if (args.backup_id) {
    let num = await pgbackups.transfer.num(args.backup_id)
    if (!num) throw new Error(`Invalid backup: ${args.backup_id}`)
    transfer = await heroku.get(`/client/v11/apps/${app}/transfers/${num}`, {host})
  } else {
    let transfers = await heroku.get(`/client/v11/apps/${app}/transfers`, {host})
    transfer = sortBy(transfers, 'created_at').reverse().find(t => !t.finished_at)
    if (!transfer) throw new Error('No active backups/transfers')
  }

  return cli.action(`Cancelling ${pgbackups.transfer.name(transfer)}`,
    heroku.post(`/client/v11/apps/${app}/transfers/${transfer.uuid}/actions/cancel`, {host}))
}

module.exports = {
  topic: 'pg',
  command: 'backups:cancel',
  description: 'cancel an in-progress backup or restore (default newest)',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'backup_id', optional: true}],
  run: cli.command({preauth: true}, run),
}
