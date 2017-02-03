'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let api = require('../lib/shared')

module.exports = {
  topic: 'redis',
  command: 'maintenance',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [
    {name: 'window', char: 'w', description: 'set weekly UTC maintenance window', hasValue: true, optional: true},
    {name: 'run', description: 'start maintenance', optional: true},
    {name: 'force', char: 'f', description: 'start maintenance without entering application maintenance mode', optional: true}
  ],
  description: 'manage maintenance windows',
  help: 'Set or change the maintenance window for your Redis instance',
  run: cli.command(co.wrap(function * (context, heroku) {
    let addon = yield api.getRedisAddon(context, heroku)

    if (addon.plan.name.match(/hobby/) != null) {
      cli.exit(1, 'redis:maintenance is not available for hobby-dev instances')
    }

    if (context.flags.window) {
      if (context.flags.window.match(/[A-Za-z]{3,10} \d\d?:[03]0/) == null) {
        cli.exit(1, 'Maintenance windows must be "Day HH:MM", where MM is 00 or 30.')
      }

      let maintenance = yield api.request(context, `/client/v11/databases/${addon.name}/maintenance_window`, 'PUT', { description: context.flags.window })
      cli.log(`Maintenance window for ${addon.name} (${addon.config_vars.join(', ')}) set to ${maintenance.window}.`)
      cli.exit(0)
    }

    if (context.flags.run) {
      let app = yield heroku.get(`/apps/${context.app}`)
      if (!app.maintenance && !context.flags.force) {
        cli.exit(1, 'Application must be in maintenance mode or --force flag must be used')
      }

      let maintenance = yield api.request(context, `/client/v11/databases/${addon.name}/maintenance`, 'POST')
      cli.log(maintenance.message)
      cli.exit(0)
    }

    let maintenance = yield api.request(context, `/client/v11/databases/${addon.name}/maintenance`, 'GET', null)
    cli.log(maintenance.message)
  }))
}
