'use strict'

const cli = require('@heroku/heroku-cli-util')
const settings = require('../../lib/setter')

function explain(setting) {
  return setting.values[setting.value]
}

module.exports = {
  topic: 'pg',
  command: 'settings:track-functions',
  description: 'track_functions controls tracking of function call counts and time used. Default is none.',
  help: `Valid values for VALUE:
none - No functions are tracked
pl   - Only procedural language functions are tracked
all  - All functions, including SQL and C language functions, are tracked. Simple SQL-language that are inlined are not tracked`,
  needsApp: true,
  needsAuth: true,
  args: [{name: 'value', optional: true}, {name: 'database', optional: true}],
  run: cli.command({preauth: true}, settings.generate('track_functions', settings.enum, explain)),
}
