'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let api = require('./shared.js')

module.exports = {
  topic: 'redis',
  command: 'credentials',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'reset', description: 'reset credentials'}],
  description: 'display credentials information',
  run: cli.command(co.wrap(function * (context, heroku) {
    let addon = yield api.getRedisAddon(context, heroku)

    if (context.flags.reset) {
      cli.log(`Resetting credentials for ${addon.name}`)
      yield api.request(context, `/redis/v0/databases/${addon.name}/credentials_rotation`, 'POST')
    } else {
      let redis = yield api.request(context, `/redis/v0/databases/${addon.name}`)
      cli.log(redis.resource_url)
    }
  }))
}
