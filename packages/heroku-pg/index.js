'use strict'

const flatten = require('lodash.flatten')

exports.topics = [
  {name: 'pg', description: 'manage postgresql databases'}
]

exports.commands = flatten([
  require('./commands/backups'),
  require('./commands/backups/info'),
  require('./commands/credentials'),
  require('./commands/diagnose'),
  require('./commands/info'),
  require('./commands/kill'),
  require('./commands/killall'),
  require('./commands/maintenance'),
  require('./commands/maintenance/run'),
  require('./commands/maintenance/window'),
  require('./commands/ps'),
  require('./commands/pull'),
  require('./commands/reset'),
  require('./commands/upgrade'),
  require('./commands/wait')
])

exports.host = require('./lib/host')
exports.fetcher = require('./lib/fetcher')
exports.psql = require('./lib/psql')
