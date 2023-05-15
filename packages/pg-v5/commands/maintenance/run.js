'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const util = require('../../lib/util')
  const { app, args, flags } = context
  const db = await fetcher.addon(app, args.database)

  if (util.starterPlan(db)) throw new Error('pg:maintenance is only available for production databases')

  cli.warn(`The new ${cli.color.bold.cyan('Data Maintenance CLI plugin')} improves and extends the ${cli.color.cmd('pg:maintenance')} functionality.`)
  cli.warn(`Follow https://devcenter.heroku.com/articles/data-maintenance-cli-commands#installation to install the plugin and run ${cli.color.cmd('data:maintenances:run')} to start a maintenance.`)

  await cli.action(`Starting maintenance for ${cli.color.addon(db.name)}`, async function () {
    if (!flags.force) {
      let appInfo = await heroku.get(`/apps/${app}`)
      if (!appInfo.maintenance) throw new Error('Application must be in maintenance mode or run with --force')
    }
    let response = await heroku.post(`/client/v11/databases/${db.id}/maintenance`, { host: host(db) })
    cli.action.done(response.message || 'done')
  }())
}

module.exports = {
  topic: 'pg',
  command: 'maintenance:run',
  description: 'start maintenance',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'database', optional: true }],
  flags: [{ name: 'force', char: 'f' }],
  run: cli.command({ preauth: true }, run)
}
