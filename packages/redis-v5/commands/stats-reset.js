'use strict'

let cli = require('@heroku/heroku-cli-util')

module.exports = {
  topic: 'redis',
  command: 'stats-reset',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'confirm', char: 'c', hasValue: true}],
  description: 'reset all stats covered by RESETSTAT (https://redis.io/commands/config-resetstat)',
  run: cli.command(async (context, heroku) => {
    let api = require('../lib/shared')(context, heroku)
    let addon = await api.getRedisAddon()

    await cli.confirmApp(context.app, context.flags.confirm, `WARNING: Irreversible action.\nAll stats covered by RESETSTAT will be reset on ${cli.color.addon(addon.name)}.`)
    let res = await api.request(`/redis/v0/databases/${addon.name}/stats/reset`, 'POST')
    cli.log(res.message)
  }),
}
