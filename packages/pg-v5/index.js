'use strict'

const {flatten} = require('lodash')

exports.topics = [
  {name: 'pg', description: 'manage postgresql databases'},
]

exports.commands = flatten([
  require('./commands/info'),
  require('./commands/locks'),
  require('./commands/ps'),
  require('./commands/psql'),
  require('./commands/pull'),
  require('./commands/repoint'),
  require('./commands/wait'),
])

exports.host = require('./lib/host')
exports.fetcher = require('./lib/fetcher')
exports.psql = require('./lib/psql')
