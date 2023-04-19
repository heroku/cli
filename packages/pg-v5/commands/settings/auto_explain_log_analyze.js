'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain (setting) {
  if (setting.value) {
    return `EXPLAIN ANALYZE execution plans will be logged.`
  }
  return `EXPLAIN ANALYZE execution plans will not be logged.`
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain:log-analyze',
  description: 'Shows actual run times on the execution plan.',
  help: `This is equivalent to calling EXPLAIN ANALYZE and can cause SIGNIFICANT performance impacts. Use with caution.`,
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'value', optional: true }, { name: 'database', optional: true }],
  run: cli.command({ preauth: true }, settings.generate('auto_explain.log_analyze', settings.boolean, explain))
}
