'use strict'

let cli = require('@heroku/heroku-cli-util')

module.exports = {
  topic: 'redis',
  command: 'keyspace-notifications',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'config', char: 'c', description: 'set keyspace notifications configuration', hasValue: true, optional: false}],
  description: 'set the keyspace notifications configuration',
  help: `Set the configuration to enable keyspace notification events:
    K     Keyspace events, published with __keyspace@<db>__ prefix.
    E     Keyevent events, published with __keyevent@<db>__ prefix.
    g     Generic commands (non-type specific) like DEL, EXPIRE, RENAME, ...
    $     String commands
    l     List commands
    s     Set commands
    h     Hash commands
    z     Sorted set commands
    t     Stream commands
    x     Expired events (events generated every time a key expires)
    e     Evicted events (events generated when a key is evicted for maxmemory)
    m     Key miss events (events generated when a key that doesn't exist is accessed)
    A     Alias for "g$lshztxe", so that the "AKE" string means all the events except "m".

    pass an empty string ('') to disable keyspace notifications
  `,
  run: cli.command(async (context, heroku) => {
    let api = require('../lib/shared')(context, heroku)
    if (context.flags.config !== '' && !context.flags.config) {
      cli.exit(1, 'Please specify a valid keyspace notification configuration.')
    }

    let addon = await api.getRedisAddon()

    let config = await api.request(`/redis/v0/databases/${addon.name}/config`, 'PATCH', {notify_keyspace_events: context.flags.config})
    cli.log(`Keyspace notifications for ${addon.name} (${addon.config_vars.join(', ')}) set to '${config.notify_keyspace_events.value}'.`)
  }),
}
