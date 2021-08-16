'use strict'

let cli = require('heroku-cli-util')

module.exports = {
  topic: 'redis',
  command: 'upgrade',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'database', optional: true }],
  flags: [
    { name: 'confirm', char: 'c', hasValue: true },
    { name: 'version', char: 'v', hasValue: true }
  ],
  description: 'perform in-place version upgrade',
  run: cli.command(async (context, heroku) => {
    if (!context.flags.version) {
      cli.exit(1, 'Please specify a valid version.')
    }

    let api = require('../lib/shared')(context, heroku)
    let addon = await api.getRedisAddon()
    let version = context.flags.version

    await cli.confirmApp(context.app, context.flags.confirm, `WARNING: Irreversible action.\nRedis database will be upgraded to ${cli.color.configVar(version)}. This cannot be undone.`)
    await cli.action(`Requesting upgrade of ${cli.color.addon(addon.name)} to ${version}`, async function () {
      await api.request(`/redis/v0/databases/${addon.name}/upgrade`, 'POST', { version: version })
      cli.action.done(`upgrade has started!`)
    }())
  })
}

