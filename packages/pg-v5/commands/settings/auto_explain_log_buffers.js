'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain(setting) {
  if (setting.value) {
    return 'Buffer statistics have been enabled for auto_explain.'
  }

  return 'Buffer statistics have been disabled for auto_explain.'
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain:log-buffers',
  description: 'Includes buffer usage statistics when execution plans are logged.',
  help: 'This is equivalent to calling EXPLAIN BUFFERS and can only be used in conjunction with pg:settings:auto-explain:log-analyze turned on.',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'value', optional: true}, {name: 'database', optional: true}],
  run: cli.command({preauth: true}, settings.generate('auto_explain.log_buffers', settings.boolean, explain)),
}
