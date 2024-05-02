'use strict'

const cli = require('@heroku/heroku-cli-util')
const settings = require('../../lib/setter')

function explain(setting) {
  if (setting.value === -1) {
    return 'The duration of each completed statement will not be logged.'
  }

  if (setting.value === 0) {
    return 'The duration of each completed statement will be logged.'
  }

  return `The duration of each completed statement will be logged if the statement ran for at least ${setting.value} milliseconds.`
}

module.exports = {
  topic: 'pg',
  command: 'settings:log-min-duration-statement',
  description: `The duration of each completed statement will be logged if the statement completes after the time specified by VALUE.
VALUE needs to specified as a whole number, in milliseconds.`,
  help: 'Setting log_min_duration_statement to zero prints all statement durations and -1 will disable logging statement durations.',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'value', optional: true}, {name: 'database', optional: true}],
  run: cli.command({preauth: true}, settings.generate('log_min_duration_statement', settings.numeric, explain)),
}
