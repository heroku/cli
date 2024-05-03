'use strict'

const cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const util = require('../../lib/util')
  const {app, args} = context
  const db = await fetcher.addon(app, args.database)

  if (util.essentialPlan(db)) throw new Error('pg:maintenance isn’t available for Essential-tier databases.')

  if (!args.window.match(/^[A-Za-z]{2,10} \d\d?:[03]0$/)) throw new Error('Window must be "Day HH:MM" where MM is 00 or 30')

  await cli.action(`Setting maintenance window for ${cli.color.addon(db.name)} to ${cli.color.cyan(args.window)}`, (async function () {
    let response = await heroku.put(`/client/v11/databases/${db.id}/maintenance_window`, {
      body: {description: args.window},
      host: host(db),
    })
    cli.action.done(response.message || 'done')
  })())
}

module.exports = {
  topic: 'pg',
  command: 'maintenance:window',
  description: 'set weekly maintenance window',
  help: `All times are in UTC.

Example:

    heroku pg:maintenance:window postgres-slippery-100 "Sunday 06:00"`,
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database'}, {name: 'window'}],
  run: cli.command({preauth: true}, run),
}
