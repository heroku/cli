'use strict'

let co = require('co')
let api = require('./shared.js')
let cli = require('heroku-cli-util')

module.exports = {
  topic: 'redis',
  command: 'wait',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  description: 'wait for Redis instance to be available',
  run: cli.command(co.wrap(function * (context, heroku) {
    let addon = yield api.getRedisAddon(context, heroku)

    let interval = setInterval(function () {
      api.request(context, `/redis/v0/databases/${addon.name}/wait`, 'GET').then(function (status) {
        if (!status['waiting?']) {
          clearInterval(interval)
        }
      }, function (error) {
        cli.error(error)
        clearInterval(interval)
      })
    }, 500)
  }))
}
