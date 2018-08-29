'use strict'
let cli = require('heroku-cli-util')

module.exports = {
  topic: 'redis',
  command: 'timeout',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'database', optional: true }],
  flags: [{ name: 'seconds', char: 's', description: 'set timeout value', hasValue: true }],
  description: 'set the number of seconds to wait before killing idle connections',
  help: 'Sets the number of seconds to wait before killing idle connections. A value of zero means that connections will not be closed.',
  run: cli.command(async (context, heroku) => {
    if (!context.flags.seconds) {
      cli.exit(1, 'Please specify a valid timeout value.')
    }
    const api = require('../lib/shared')(context, heroku)

    let addon = await api.getRedisAddon()

    let config = await api.request(`/redis/v0/databases/${addon.name}/config`, 'PATCH', { timeout: parseInt(context.flags.seconds, 10) })
    cli.log(`Timeout for ${addon.name} (${addon.config_vars.join(', ')}) set to ${config.timeout.value} seconds.`)
    if (config.timeout.value === 0) {
      cli.log('Connections to the Redis instance can idle indefinitely.')
    } else {
      cli.log(`Connections to the Redis instance will be stopped after idling for ${config.timeout.value} seconds.`)
    }
  })
}
