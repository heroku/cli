'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain(setting) {
  if (setting.value === -1) {
    return 'Execution plan logging has been disabled.'
  }

  if (setting.value === 0) {
    return 'All queries will have their execution plans logged.'
  }

  return `All execution plans will be logged for queries taking up to ${setting.value} milliseconds or more.`
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain:log-min-duration',
  description: 'Sets the minimum execution time in milliseconds for a statement\'s plan to be logged.',
  help: `Setting this value to 0 will log all queries. Setting this value to -1 will disable logging entirely.

WARNING: Setting a low value may have performance impacts on your database as well as generate a large volume of logs.`,
  needsApp: true,
  needsAuth: true,
  args: [{name: 'value', optional: true}, {name: 'database', optional: true}],
  run: cli.command({preauth: true}, settings.generate('auto_explain.log_min_duration', settings.numeric, explain)),
}
