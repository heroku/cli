'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)
  const psql = require('../lib/psql')

  const {app, args, flags} = context
  const {database} = args
  const {verbose} = flags

  let db = yield fetcher.database(app, database)

  let query = `
SELECT
 pid,
 state,
 application_name AS source,
 age(now(),xact_start) AS running_for,
 waiting,
 query
FROM pg_stat_activity
WHERE
 query <> '<insufficient privilege>'
 ${verbose ? '' : "AND state <> 'idle'"}
 AND pid <> pg_backend_pid()
 ORDER BY query_start DESC
`

  let output = yield psql.exec(db, query)
  process.stdout.write(output)
}

module.exports = {
  topic: 'pg',
  command: 'ps',
  description: 'view active queries with execution time',
  needsApp: true,
  needsAuth: true,
  flags: [{name: 'verbose', char: 'v'}],
  args: [{name: 'database', optional: true}],
  run: cli.command({preauth: true}, co.wrap(run))
}
