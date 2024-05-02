'use strict'

const cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const util = require('../../lib/util')
  const {app, args, flags} = context
  const db = await fetcher.addon(app, args.database)

  if (util.essentialPlan(db)) throw new Error('pg:maintenance isn’t available for Essential-tier databases.')
  await cli.action(`Starting maintenance for ${cli.color.addon(db.name)}`, (async function () {
    if (!flags.force) {
      let appInfo = await heroku.get(`/apps/${app}`)
      if (!appInfo.maintenance) throw new Error('Application must be in maintenance mode or run with --force')
    }

    let response = await heroku.post(`/client/v11/databases/${db.id}/maintenance`, {host: host(db)})
    cli.action.done(response.message || 'done')
  })())
}

module.exports = {
  topic: 'pg',
  command: 'maintenance:run',
  description: 'start maintenance',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'force', char: 'f'}],
  run: cli.command({preauth: true}, run),
}
