'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain (setting) {
  if (setting.value) {
    return `TODO value`
  }
  return `TODO`
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain:log-min-duration',
  description: 'TODO',
  help: 'TODO',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'value', optional: true }, { name: 'database', optional: true }],
  run: cli.command({ preauth: true }, settings.generate('auto_explain.log_min_duration', settings.numeric, explain))
}
