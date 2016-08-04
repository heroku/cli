'use strict'

exports.topics = [
  {name: 'pg', description: 'manage postgresql databases'}
]

exports.commands = [
  require('./commands/info').info,
  require('./commands/info').root,
  require('./commands/wait')
]

exports.host = require('./lib/host')
exports.fetcher = require('./lib/fetcher')
exports.psql = require('./lib/psql')
