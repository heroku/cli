'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)
  const host = require('../lib/host')

  await cli.action('Terminating connections for all credentials', (async function () {
    const db = await fetcher.addon(context.app, context.args.database)
    await heroku.post(`/client/v11/databases/${db.id}/connection_reset`, {host: host(db)})
  })())
}

module.exports = {
  topic: 'pg',
  command: 'killall',
  description: 'terminates all connections for all credentials',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  run: cli.command({preauth: true}, run),
}
