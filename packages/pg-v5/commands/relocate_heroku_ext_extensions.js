'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const util = require('../lib/util')
  const host = require('../lib/host')
  const fetcher = require('../lib/fetcher')(heroku)

  const {app, args, flags} = context

  let db = await fetcher.addon(app, args.database)

  if (util.essentialPlan(db)) throw new Error('You can’t perform this operation on Essential-tier databases.')

  let result = await heroku.post(`/client/v11/databases/${encodeURIComponent(db.name)}/migrate_extensions_to_public_schema`, {
    host: host(db),
  })

  cli.log(result.message)
}

module.exports = {
  topic: 'pg',
  command: 'relocate-heroku-ext-extensions',
  description: 'Migrate extensions out of the heroku_ext schema and into the public schema.',
  needsApp: true,
  needsAuth: true,
  flags: [{name: 'verbose', char: 'v'}],
  args: [{name: 'database', optional: true}],
  run: cli.command({preauth: true}, run),
}
