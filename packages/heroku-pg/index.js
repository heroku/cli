'use strict'

const flatten = require('lodash.flatten')

exports.topics = [
  {name: 'pg', description: 'manage postgresql databases'}
]

exports.commands = flatten([
  require('./commands/backups'),
  require('./commands/backups/cancel'),
  require('./commands/backups/capture'),
  require('./commands/backups/delete'),
  require('./commands/backups/download'),
  require('./commands/backups/info'),
  require('./commands/backups/restore'),
  require('./commands/backups/schedule'),
  require('./commands/backups/schedules'),
  require('./commands/backups/unschedule'),
  require('./commands/backups/url'),
  require('./commands/copy'),
  require('./commands/credentials'),
  require('./commands/diagnose'),
  require('./commands/info'),
  require('./commands/kill'),
  require('./commands/killall'),
  require('./commands/links'),
  require('./commands/links/create'),
  require('./commands/links/destroy'),
  require('./commands/maintenance'),
  require('./commands/maintenance/run'),
  require('./commands/maintenance/window'),
  require('./commands/promote'),
  require('./commands/ps'),
  require('./commands/psql'),
  require('./commands/pull'),
  require('./commands/reset'),
  require('./commands/unfollow'),
  require('./commands/upgrade'),
  require('./commands/wait')
])

exports.host = require('./lib/host')
exports.fetcher = require('./lib/fetcher')
exports.psql = require('./lib/psql')
