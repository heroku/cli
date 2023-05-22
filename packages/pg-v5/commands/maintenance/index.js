'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const util = require('../../lib/util')
  const { app, args } = context
  const db = await fetcher.addon(app, args.database)

  if (util.starterPlan(db)) throw new Error('pg:maintenance is only available for production databases')

  let newPluginMessage = `You can also list the maintenance events for your Postgres database with ${cli.color.cmd('data:maintenances')}.`
  newPluginMessage += `\nFollow https://devcenter.heroku.com/articles/data-maintenance-cli-commands`
  newPluginMessage += `\nto install the ${cli.color.bold.cyan('Data Maintenance CLI plugin')}.`

  cli.warn(newPluginMessage)

  let info = await heroku.get(`/client/v11/databases/${db.id}/maintenance`, { host: host(db) })
  cli.log(info.message)
}

module.exports = {
  topic: 'pg',
  command: 'maintenance',
  description: 'show current maintenance information',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'database', optional: true }],
  run: cli.command({ preauth: true }, run)
}
