'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain(setting) {
  if (setting.value) {
    return 'When login attempts are made, a log message will be emitted in your application\'s logs.'
  }

  return 'When login attempts are made, no log message will be emitted in your application\'s logs.'
}

module.exports = {
  topic: 'pg',
  command: 'settings:log-connections',
  description: 'Controls whether a log message is produced when a login attempt is made. Default is true.',
  help: 'Setting log_connections to false stops emitting log messages for all attempts to login to the database.',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'value', optional: true}, {name: 'database', optional: true}],
  run: cli.command({preauth: true}, settings.generate('log_connections', settings.boolean, explain)),
}
