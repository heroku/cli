'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain (setting) {
  return setting.values[setting.value]
}

module.exports = {
  topic: 'pg',
  command: 'settings:log-statement',
  description: `log_statement controls which SQL statements are logged.`,
  help: `Valid values for VALUE:
none - No statements are logged
ddl  - All data definition statements, such as CREATE, ALTER and DROP will be logged
mod  - Includes all statements from ddl as well as data-modifying statements such as INSERT, UPDATE, DELETE, TRUNCATE, COPY
all  - All statements are logged`,
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'value', optional: true }, { name: 'database', optional: true }],
  run: cli.command({ preauth: true }, settings.generate('log_statement', settings.enum, explain))
}
