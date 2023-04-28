'use strict'

const api = require('../lib/shared')
const cli = require('heroku-cli-util')

module.exports = {
  topic: 'redis',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'json', description: 'format output as JSON', hasValue: false}],
  description: 'gets information about redis',
  run: cli.command((ctx, heroku) => api(ctx, heroku).info()),
}
