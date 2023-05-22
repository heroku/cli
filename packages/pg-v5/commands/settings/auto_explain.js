'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain(setting) {
  if (setting.value) {
    return 'Execution plans of queries will be logged for future connections.'
  }

  return 'Execution plans of queries will not be logged for future connections.'
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain',
  description: 'Automatically log execution plans of queries without running EXPLAIN by hand.',
  help: `The auto_explain module is loaded at session-time so existing connections will not be logged.
Restart your Heroku app and/or restart existing connections for logging to start taking place.`,
  needsApp: true,
  needsAuth: true,
  args: [{name: 'value', optional: true}, {name: 'database', optional: true}],
  run: cli.command({preauth: true}, settings.generate('auto_explain', settings.boolean, explain)),
}
