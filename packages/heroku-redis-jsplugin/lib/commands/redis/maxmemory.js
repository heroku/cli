'use strict'
let cli = require('heroku-cli-util')
let api = require('./shared.js')

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
    allkeys-lru     # removes less recently used keys first
    volatile-lru    # removes less recently used keys first that have an expiry set
    allkeys-random  # evicts random keys
    volatile-random # evicts random keys but only those that have an expiry set
    volatile-ttl    # only evicts keys with an expiry set and a short TTL
  `,
  run: cli.command(function * (context, heroku) {
    if (!context.flags.policy) {
      cli.error('Please specify a valid maxmemory eviction policy.')
      process.exit(1)
    }
    let addonsFilter = api.make_addons_filter(context.args.database)
    let addons = addonsFilter(yield heroku.apps(context.app).addons().listByApp())
    if (addons.length === 0) {
      cli.error('No redis databases found')
      process.exit(1)
    } else if (addons.length > 1) {
      let names = addons.map(function (addon) { return addon.name })
      cli.error(`Please specify a single instance. Found: ${names.join(', ')}`)
      process.exit(1)
    }
    let addon = addons[0]
    let config = yield api.request(context, `/redis/v0/databases/${addon.name}/config`, 'PATCH', { maxmemory_policy: context.flags.policy })
    console.log(`Maxmemory policy for ${addon.name} (${addon.config_vars.join(', ')}) set to ${config.maxmemory_policy.value}.`)
    console.log(`${config.maxmemory_policy.value} ${config.maxmemory_policy.values[config.maxmemory_policy.value]}.`)
  })
}
