'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const fetcher = require('../lib/fetcher')
  const psql = require('../lib/psql')

  const { app, args, flags } = context
  const { pid, database } = args
  const { force } = flags

  let db = yield fetcher(heroku).database(app, database)

  let query = `
SELECT ${force ? 'pg_terminate_backend' : 'pg_cancel_backend'}(${parseInt(pid)});`

  let output = yield psql.exec(db, query)
  process.stdout.write(output)
}

module.exports = {
  topic: 'pg',
  command: 'kill',
  description: 'kill a query',
  needsApp: true,
  needsAuth: true,
  flags: [{ name: 'force', char: 'f' }],
  args: [
    { name: 'pid' },
    { name: 'database', optional: true }
  ],
  run: cli.command({ preauth: true }, co.wrap(run))
}
