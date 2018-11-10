'use strict'

const cli = require('heroku-cli-util')

module.exports = {
  topic: 'redis',
  command: 'maintenance',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'database', optional: true }],
  flags: [
    { name: 'window', char: 'w', description: 'set weekly UTC maintenance window', hasValue: true, optional: true },
    { name: 'run', description: 'start maintenance', optional: true },
    { name: 'force', char: 'f', description: 'start maintenance without entering application maintenance mode', optional: true }
  ],
  description: 'manage maintenance windows',
  help: 'Set or change the maintenance window for your Redis instance',
  run: cli.command(async (context, heroku) => {
    const api = require('../lib/shared')(context, heroku)
    let addon = await api.getRedisAddon()

    if (addon.plan.name.match(/hobby/) != null) {
      cli.exit(1, 'redis:maintenance is not available for hobby-dev instances')
    }

    if (context.flags.window) {
      if (context.flags.window.match(/[A-Za-z]{3,10} \d\d?:[03]0/) == null) {
        cli.exit(1, 'Maintenance windows must be "Day HH:MM", where MM is 00 or 30.')
      }

      let maintenance = await api.request(`/redis/v0/databases/${addon.name}/maintenance_window`, 'PUT', { description: context.flags.window })
      cli.log(`Maintenance window for ${addon.name} (${addon.config_vars.join(', ')}) set to ${maintenance.window}.`)
      cli.exit(0)
    }

    if (context.flags.run) {
      let app = await heroku.get(`/apps/${context.app}`)
      if (!app.maintenance && !context.flags.force) {
        cli.exit(1, 'Application must be in maintenance mode or --force flag must be used')
      }

      let maintenance = await api.request(`/redis/v0/databases/${addon.name}/maintenance`, 'POST')
      cli.log(maintenance.message)
      cli.exit(0)
    }

    let maintenance = await api.request(`/redis/v0/databases/${addon.name}/maintenance`, 'GET', null)
    cli.log(maintenance.message)
  })
}
