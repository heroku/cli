'use strict'

const flatten = require('lodash.flatten')

exports.topics = [
  {name: 'pg', description: 'manage postgresql databases'}
]

exports.commands = flatten([
  require('./commands/backups'),
  require('./commands/diagnose'),
  require('./commands/info'),
  require('./commands/kill'),
  require('./commands/killall'),
  require('./commands/ps'),
  require('./commands/wait')
])

exports.host = require('./lib/host')
exports.fetcher = require('./lib/fetcher')
exports.psql = require('./lib/psql')
