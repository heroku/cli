'use strict'

let cli = require('heroku-cli-util')

module.exports = {
  topic: 'redis',
  command: 'maxmemory',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'policy', char: 'p', description: 'set policy name', hasValue: true, optional: false}],
  description: 'set the key eviction policy',
  help: `Set the key eviction policy when instance reaches its storage limit. Available policies for key eviction include:

    noeviction      # returns errors when memory limit is reached
    allkeys-lfu     # removes less frequently used keys first
    volatile-lfu    # removes less frequently used keys first that have an expiry set
    allkeys-lru     # removes less recently used keys first
    volatile-lru    # removes less recently used keys first that have an expiry set
    allkeys-random  # evicts random keys
    volatile-random # evicts random keys but only those that have an expiry set
    volatile-ttl    # only evicts keys with an expiry set and a short TTL
  `,
  run: cli.command(async (context, heroku) => {
    let api = require('../lib/shared')(context, heroku)
    if (!context.flags.policy) {
      cli.exit(1, 'Please specify a valid maxmemory eviction policy.')
    }

    let addon = await api.getRedisAddon()

    let config = await api.request(`/redis/v0/databases/${addon.name}/config`, 'PATCH', {maxmemory_policy: context.flags.policy})
    cli.log(`Maxmemory policy for ${addon.name} (${addon.config_vars.join(', ')}) set to ${config.maxmemory_policy.value}.`)
    cli.log(`${config.maxmemory_policy.value} ${config.maxmemory_policy.values[config.maxmemory_policy.value]}.`)
  }),
}
