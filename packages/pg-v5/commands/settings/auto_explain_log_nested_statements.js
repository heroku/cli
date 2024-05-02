'use strict'

const cli = require('@heroku/heroku-cli-util')
const settings = require('../../lib/setter')

function explain(setting) {
  if (setting.value) {
    return 'Nested statements will be included in execution plan logs.'
  }

  return 'Only top-level execution plans will be included in logs.'
}

module.exports = {
  topic: 'pg',
  command: 'settings:auto-explain:log-nested-statements',
  description: 'Nested statements are included in the execution plan\'s log.',
  help: '',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'value', optional: true}, {name: 'database', optional: true}],
  run: cli.command({preauth: true}, settings.generate('auto_explain.log_nested_statements', settings.boolean, explain)),
}
