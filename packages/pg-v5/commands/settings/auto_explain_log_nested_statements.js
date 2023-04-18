'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain (setting) {
  if (setting.value === "on") {
    return `Nested statements will be included in execution plan logs.`
  }
  return `Only top-level execution plans will be included in logs.`
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain:log-nested-statements',
  description: 'Logs nested statements to be included in the execution plan\'s log.',
  help: `Valid values for VALUE:
on  - Enables logging nested statements.
off - Disables logging nested statements.`,
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'value', optional: true }, { name: 'database', optional: true }],
  run: cli.command({ preauth: true }, settings.generate('auto_explain.log_nested_statements', settings.enum, explain))
}
