'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain (setting) {
  if (setting.value === "on") {
    return `EXPLAIN ANALYZE execution plans will be logged.`
  }
  return `EXPLAIN ANALYZE execution plans will not be logged.`
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain:log-analyze',
  description: 'Logs EXPLAIN ANALYZE execution plans. This can cause SIGNIFICANT performance impacts. Use with caution.',
  help: `Valid values for VALUE:
on  - Includes EXPLAIN ANALYZE execution plans.
off - Does not include EXPLAIN ANALYZE execution plans.`,
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'value', optional: true }, { name: 'database', optional: true }],
  run: cli.command({ preauth: true }, settings.generate('auto_explain.log_analyze', settings.enum, explain))
}
