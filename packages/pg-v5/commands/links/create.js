'use strict'

const cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)
  const util = require('../../lib/util')
  const addons = require('@heroku-cli/plugin-addons').resolve
  let {app, args, flags} = context

  let service = async function (name) {
    let addon = await addons.addon(heroku, app, name)
    if (!addon.plan.name.match(/^heroku-(redis|postgresql)/)) throw new Error('Remote database must be heroku-redis or heroku-postgresql')
    return addon
  }

  const [db, target] = await Promise.all([
    fetcher.addon(app, args.database),
    service(args.remote),
  ])

  if (util.essentialPlan(db)) throw new Error('pg:links isn’t available for Essential-tier databases.')
  if (util.essentialPlan(target)) throw new Error('pg:links isn’t available for Essential-tier databases.')

  await cli.action(`Adding link from ${cli.color.addon(target.name)} to ${cli.color.addon(db.name)}`, (async function () {
    let link = await heroku.post(`/client/v11/databases/${db.id}/links`, {
      body: {
        target: target.name,
        as: flags.as,
      },
      host: host(db),
    })
    if (link.message) throw new Error(link.message)
    cli.action.done(`done, ${cli.color.cyan(link.name)}`)
  })())
}

module.exports = {
  topic: 'pg',
  command: 'links:create',
  description: 'create a link between data stores',
  help: `Example:

    heroku pg:links:create HEROKU_REDIS_RED HEROKU_POSTGRESQL_CERULEAN`,
  needsApp: true,
  needsAuth: true,
  args: [{name: 'remote'}, {name: 'database'}],
  flags: [{name: 'as', hasValue: true, description: 'name of link to create'}],
  run: cli.command({preauth: true}, run),
}
