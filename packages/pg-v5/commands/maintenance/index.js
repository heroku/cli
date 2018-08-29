'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const util = require('../../lib/util')
  const { app, args } = context
  const db = yield fetcher.addon(app, args.database)

  if (util.starterPlan(db)) throw new Error('pg:maintenance is only available for production databases')
  let info = yield heroku.get(`/client/v11/databases/${db.id}/maintenance`, { host: host(db) })
  cli.log(info.message)
}

module.exports = {
  topic: 'pg',
  command: 'maintenance',
  description: 'show current maintenance information',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'database', optional: true }],
  run: cli.command({ preauth: true }, co.wrap(run))
}
