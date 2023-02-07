'use strict'

const { flatten } = require('lodash')

exports.topics = [
  { name: 'pg', description: 'manage postgresql databases' }
]

exports.commands = flatten([
  require('./commands/pg/backups'),
  require('./commands/pg/backups/cancel'),
  require('./commands/pg/backups/capture'),
  require('./commands/pg/backups/delete'),
  require('./commands/pg/backups/download'),
  require('./commands/pg/backups/info'),
  require('./commands/pg/backups/restore'),
  require('./commands/pg/backups/schedule'),
  require('./commands/pg/backups/schedules'),
  require('./commands/pg/backups/unschedule'),
  require('./commands/pg/backups/url'),
  require('./commands/pg/bloat'),
  require('./commands/pg/blocking'),
  require('./commands/pg/connection_pooling'),
  require('./commands/pg/copy'),
  require('./commands/pg/credentials'),
  require('./commands/pg/credentials/create'),
  require('./commands/pg/credentials/destroy'),
  require('./commands/pg/credentials/repair_default'),
  require('./commands/pg/credentials/rotate'),
  require('./commands/pg/credentials/url'),
  require('./commands/pg/diagnose'),
  require('./commands/pg/info'),
  require('./commands/pg/kill'),
  require('./commands/pg/killall'),
  require('./commands/pg/links'),
  require('./commands/pg/links/create'),
  require('./commands/pg/links/destroy'),
  require('./commands/pg/locks'),
  require('./commands/pg/maintenance'),
  require('./commands/pg/maintenance/run'),
  require('./commands/pg/maintenance/window'),
  require('./commands/pg/outliers'),
  require('./commands/pg/promote'),
  require('./commands/pg/ps'),
  require('./commands/pg/psql'),
  require('./commands/pg/pull'),
  require('./commands/pg/repoint'),
  require('./commands/pg/reset'),
  require('./commands/pg/settings'),
  require('./commands/pg/settings/log_lock_waits'),
  require('./commands/pg/settings/log_min_duration_statement'),
  require('./commands/pg/settings/log_statement'),
  require('./commands/pg/settings/track_functions'),
  require('./commands/pg/unfollow'),
  require('./commands/pg/upgrade'),
  require('./commands/pg/vacuum_stats'),
  require('./commands/pg/wait')
])

exports.host = require('./lib/host')
exports.fetcher = require('./lib/fetcher')
exports.psql = require('./lib/psql')
