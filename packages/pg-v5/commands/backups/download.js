'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function defaultFilename () {
  const fs = require('fs')
  let f = 'latest.dump'
  if (!fs.existsSync(f)) return f
  let i = 1
  do f = `latest.dump.${i++}`
  while (fs.existsSync(f))
  return f
}

function * run (context, heroku) {
  const host = require('../../lib/host')()
  const pgbackups = require('../../lib/pgbackups')(context, heroku)
  const download = require('../../lib/download')
  const { sortBy } = require('lodash')

  const { app, args, flags } = context
  const output = flags.output || defaultFilename()

  let num, info

  yield cli.action(`Getting backup from ${cli.color.app(app)}`, co(function * () {
    if (args.backup_id) {
      num = yield pgbackups.transfer.num(args.backup_id)
      if (!num) throw new Error(`Invalid Backup: ${args.backup_id}`)
    } else {
      let transfers = yield heroku.get(`/client/v11/apps/${app}/transfers`, { host })
      let lastBackup = sortBy(transfers.filter(t => t.succeeded && t.to_type === 'gof3r'), 'created_at').pop()
      if (!lastBackup) throw new Error(`No backups on ${cli.color.app(app)}. Capture one with ${cli.color.cmd('heroku pg:backups:capture')}`)
      num = lastBackup.num
    }
    cli.action.status(`fetching url of #${num}`)

    info = yield heroku.post(`/client/v11/apps/${app}/transfers/${num}/actions/public-url`, { host })
    cli.action.done(`done, #${num}`)
  }))

  yield download(info.url, output, { progress: true })
}

module.exports = {
  topic: 'pg',
  command: 'backups:download',
  description: 'downloads database backup',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'backup_id', optional: true }],
  flags: [
    { name: 'output', char: 'o', description: 'location to download to. Defaults to latest.dump', hasValue: true }
  ],
  run: cli.command({ preauth: true }, co.wrap(run))
}
