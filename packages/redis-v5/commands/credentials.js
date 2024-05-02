'use strict'

let cli = require('@heroku/heroku-cli-util')

module.exports = {
  topic: 'redis',
  command: 'credentials',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'reset', description: 'reset credentials'}],
  description: 'display credentials information',
  run: cli.command(async (context, heroku) => {
    const api = require('../lib/shared')(context, heroku)
    const addon = await api.getRedisAddon()

    if (context.flags.reset) {
      cli.log(`Resetting credentials for ${addon.name}`)
      await api.request(`/redis/v0/databases/${addon.name}/credentials_rotation`, 'POST')
    } else {
      let redis = await api.request(`/redis/v0/databases/${addon.name}`)
      cli.log(redis.resource_url)
    }
  }),
}
