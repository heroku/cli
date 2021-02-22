'use strict'

const cli = require('heroku-cli-util')
const psql = require('../lib/psql')

async function ensurePGStatStatement(db) {
  let query = `
SELECT exists(
  SELECT 1 FROM pg_extension e LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname='pg_stat_statements' AND n.nspname = 'public'
) AS available`
  let output = await psql.exec(db, query)

  if (!output.includes('t')) {
    throw new Error(`pg_stat_statements extension need to be installed in the public schema first.
You can install it by running: CREATE EXTENSION pg_stat_statements;`)
  }
}

async function run(context, heroku) {
  const fetcher = require('../lib/fetcher')

  const { app, args, flags } = context
  const { database } = args

  let db = await fetcher(heroku).database(app, database)

  await ensurePGStatStatement(db)

  if (flags.reset) {
    await psql.exec(db, 'SELECT pg_stat_statements_reset()')
    return
  }

  let truncatedQueryString = flags.truncate
    ? 'CASE WHEN length(query) <= 40 THEN query ELSE substr(query, 0, 39) || \'…\' END'
    : 'query'

  let limit = 10
  if (context.flags.num) {
    if (/^(\d+)$/.exec(flags.num)) {
      limit = parseInt(flags.num)
    } else {
      throw new Error(`Cannot parse num param value "${flags.num}" to a number`)
    }
  }

  let query = `
SELECT interval '1 millisecond' * total_time AS total_exec_time,
to_char((total_time/sum(total_time) OVER()) * 100, 'FM90D0') || '%'  AS prop_exec_time,
to_char(calls, 'FM999G999G999G990') AS ncalls,
interval '1 millisecond' * (blk_read_time + blk_write_time) AS sync_io_time,
${truncatedQueryString} AS query
FROM pg_stat_statements WHERE userid = (SELECT usesysid FROM pg_user WHERE usename = current_user LIMIT 1)
ORDER BY total_time DESC
LIMIT ${limit}
`

  let output = await psql.exec(db, query)
  process.stdout.write(output)
}

module.exports = {
  topic: 'pg',
  command: 'outliers',
  description: 'show 10 queries that have longest execution time in aggregate',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'database', optional: true }],
  flags: [
    { name: 'reset', description: 'resets statistics gathered by pg_stat_statements' },
    { name: 'truncate', char: 't', description: 'truncate queries to 40 characters' },
    { name: 'num', char: 'n', description: 'the number of queries to display (default: 10)', hasValue: true }
  ],
  run: cli.command({ preauth: true }, run)
}
