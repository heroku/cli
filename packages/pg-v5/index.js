'use strict'

const {flatten} = require('lodash')

exports.topics = [
  {name: 'pg', description: 'manage postgresql databases'},
]

exports.commands = flatten([
  require('./commands/blocking'),
  require('./commands/connection_pooling'),
  require('./commands/diagnose'),
  require('./commands/info'),
  require('./commands/kill'),
  require('./commands/killall'),
  require('./commands/locks'),
  require('./commands/outliers'),
  require('./commands/promote'),
  require('./commands/ps'),
  require('./commands/psql'),
  require('./commands/pull'),
  require('./commands/repoint'),
  require('./commands/unfollow'),
  require('./commands/upgrade'),
  require('./commands/vacuum_stats'),
  require('./commands/wait'),
])

exports.host = require('./lib/host')
exports.fetcher = require('./lib/fetcher')
exports.psql = require('./lib/psql')
