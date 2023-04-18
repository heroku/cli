'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain (setting) {
  if (setting.value == "on") {
    return `Trigger execution statistics have been enabled.`
  }
  return `Trigger execution statistics have been disabled.`
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain:log-triggers',
  description: 'Includes trigger execution statistics in execution plan logs.',
  help: `This parameter can only be used in conjunction with pg:settings:auto_explain:log_analyze on

Valid values for VALUE:
on  - Enables logging of trigger execution statistics.
off - Disables logging of trigger execution statistics.`,
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'value', optional: true }, { name: 'database', optional: true }],
  run: cli.command({ preauth: true }, settings.generate('auto_explain.log_triggers', settings.enum, explain))
}
