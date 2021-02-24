'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const util = require('../../lib/util')
  const { app, args, flags } = context
  const db = yield fetcher.addon(app, args.database)

  if (util.starterPlan(db)) throw new Error('pg:maintenance is only available for production databases')
  yield cli.action(`Starting maintenance for ${cli.color.addon(db.name)}`, co(function * () {
    if (!flags.force) {
      let appInfo = yield heroku.get(`/apps/${app}`)
      if (!appInfo.maintenance) throw new Error('Application must be in maintenance mode or run with --force')
    }
    let response = yield heroku.post(`/client/v11/databases/${db.id}/maintenance`, { host: host(db) })
    cli.action.done(response.message || 'done')
  }))
}

module.exports = {
  topic: 'pg',
  command: 'maintenance:run',
  description: 'start maintenance',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'database', optional: true }],
  flags: [{ name: 'force', char: 'f' }],
  run: cli.command({ preauth: true }, co.wrap(run))
}
