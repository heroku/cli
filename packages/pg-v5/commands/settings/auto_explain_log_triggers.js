'use strict'

const cli = require('@heroku/heroku-cli-util')
const settings = require('../../lib/setter')

function explain(setting) {
  if (setting.value) {
    return 'Trigger execution statistics have been enabled for auto_explain.'
  }

  return 'Trigger execution statistics have been disabled for auto_explain.'
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain:log-triggers',
  description: 'Includes trigger execution statistics in execution plan logs.',
  help: 'This parameter can only be used in conjunction with pg:settings:auto-explain:log-analyze turned on.',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'value', optional: true}, {name: 'database', optional: true}],
  run: cli.command({preauth: true}, settings.generate('auto_explain.log_triggers', settings.boolean, explain)),
}
