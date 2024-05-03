'use strict'

const cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)
  const util = require('../../lib/util')
  let {app, args, flags} = context

  const db = await fetcher.addon(app, args.database)

  if (util.essentialPlan(db)) throw new Error('pg:links isn’t available for Essential-tier databases.')

  await cli.confirmApp(app, flags.confirm, `WARNING: Destructive action
This command will affect the database ${cli.color.addon(db.name)}
This will delete ${cli.color.cyan(args.link)} along with the tables and views created within it.
This may have adverse effects for software written against the ${cli.color.cyan(args.link)} schema.
`)
  await cli.action(`Destroying link ${cli.color.cyan(args.link)} from ${cli.color.addon(db.name)}`, (async function () {
    await heroku.delete(`/client/v11/databases/${db.id}/links/${encodeURIComponent(args.link)}`, {host: host(db)})
  })())
}

module.exports = {
  topic: 'pg',
  command: 'links:destroy',
  description: 'destroys a link between data stores',
  help: `Example:

    heroku pg:links:destroy HEROKU_POSTGRESQL_CERULEAN redis-symmetrical-100`,
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database'}, {name: 'link'}],
  flags: [{name: 'confirm', char: 'c', hasValue: true}],
  run: cli.command({preauth: true}, run),
}
