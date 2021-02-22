'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const host = require('../../lib/host')()
  const pgbackups = require('../../lib/pgbackups')(context, heroku)
  const { sortBy } = require('lodash')

  const { app, args } = context

  let num

  if (args.backup_id) {
    num = await pgbackups.transfer.num(args.backup_id)
    if (!num) throw new Error(`Invalid Backup: ${args.backup_id}`)
  } else {
    let transfers = await heroku.get(`/client/v11/apps/${app}/transfers`, { host })
    let lastBackup = sortBy(transfers.filter(t => t.succeeded && t.to_type === 'gof3r'), 'created_at').pop()
    if (!lastBackup) throw new Error(`No backups on ${cli.color.app(app)}. Capture one with ${cli.color.cmd('heroku pg:backups:capture')}`)
    num = lastBackup.num
  }

  let info = await heroku.post(`/client/v11/apps/${app}/transfers/${num}/actions/public-url`, { host })
  cli.log(info.url)
}

let cmd = {
  topic: 'pg',
  description: 'get secret but publicly accessible URL of a backup',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'backup_id', optional: true }],
  flags: [
    // ignored but present for backwards compatibility
    { name: 'quiet', char: 'q', hidden: true }
  ],
  run: cli.command({ preauth: true }, run)
}

module.exports = [
  Object.assign({ command: 'backups:url' }, cmd),
  Object.assign({ command: 'backups:public-url', hidden: true }, cmd),
  Object.assign({ command: 'backups:publicurl', hidden: true }, cmd)
]
