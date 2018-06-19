'use strict'

const cli = require('heroku-cli-util')

module.exports = {
  topic: 'redis',
  command: 'wait',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  description: 'wait for Redis instance to be available',
  run: cli.command(async (context, heroku) => {
    const api = require('../lib/shared')(context, heroku)
    const addon = await api.getRedisAddon()

    let interval = setInterval(function () {
      api.request(`/redis/v0/databases/${addon.name}/wait`, 'GET').then(function (status) {
        if (!status['waiting?']) {
          clearInterval(interval)
        }
      }, function (error) {
        cli.error(error)
        clearInterval(interval)
      })
    }, 500)
  })
}
