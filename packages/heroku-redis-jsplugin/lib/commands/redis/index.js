'use strict'

let co = require('co')
let api = require('./shared.js')
let cli = require('heroku-cli-util')

module.exports = {
  topic: 'redis',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  description: 'gets information about redis',
  run: cli.command(co.wrap(api.info))
}
