'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain (setting) {
  if (setting.value === "on") {
    return `Verbose execution plan logging has been enabled.`
  }
  return `Verbose execution plan logging has been disabled.`
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain:log-verbose',
  description: 'Include verbose details in logs.',
  help: `Valid values for VALUE:
on  - Enables verbose execution plans.
off - disables verbose execution plans.`,
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'value', optional: true }, { name: 'database', optional: true }],
  run: cli.command({ preauth: true }, settings.generate('auto_explain.log_verbose', settings.enum, explain))
}
