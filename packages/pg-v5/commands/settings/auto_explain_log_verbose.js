'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain(setting) {
  if (setting.value) {
    return 'Verbose execution plan logging has been enabled for auto_explain.'
  }

  return 'Verbose execution plan logging has been disabled for auto_explain.'
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain:log-verbose',
  description: 'Include verbose details in execution plans.',
  help: 'This is equivalent to calling EXPLAIN VERBOSE.',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'value', optional: true}, {name: 'database', optional: true}],
  run: cli.command({preauth: true}, settings.generate('auto_explain.log_verbose', settings.boolean, explain)),
}
