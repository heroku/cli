'use strict'

const cli = require('heroku-cli-util')
const settings = require('../../lib/setter')

function explain(setting) {
  if (setting.value) {
    return 'When a deadlock is detected, a log message will be emitted in your application\'s logs.'
  }

  return 'When a deadlock is detected, no log message will be emitted in your application\'s logs.'
}

module.exports = {
  topic: 'pg',
  command: 'settings:log-lock-waits',
  description: 'Controls whether a log message is produced when a session waits longer than the deadlock_timeout to acquire a lock. deadlock_timeout is set to 1 second',
  help: `Delays due to lock contention occur when multiple transactions are trying to access the same resource at the same time.
Applications and their query patterns should try to avoid changes to many different tables within the same transaction.`,
  needsApp: true,
  needsAuth: true,
  args: [{name: 'value', optional: true}, {name: 'database', optional: true}],
  run: cli.command({preauth: true}, settings.generate('log_lock_waits', settings.boolean, explain)),
}
