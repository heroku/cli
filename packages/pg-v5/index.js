'use strict'

const {flatten} = require('lodash')

exports.topics = [
  {name: 'pg', description: 'manage postgresql databases'},
]

exports.commands = flatten([
  require('./commands/backups'),
  require('./commands/backups/cancel'),
  require('./commands/backups/capture'),
  require('./commands/backups/download'),
  require('./commands/backups/restore'),
  require('./commands/backups/schedule'),
  require('./commands/backups/unschedule'),
  require('./commands/bloat'),
  require('./commands/blocking'),
  require('./commands/connection_pooling'),
  require('./commands/copy'),
  require('./commands/credentials'),
  require('./commands/credentials/create'),
  require('./commands/credentials/destroy'),
  require('./commands/credentials/repair_default'),
  require('./commands/credentials/rotate'),
  require('./commands/credentials/url'),
  require('./commands/diagnose'),
  require('./commands/info'),
  require('./commands/kill'),
  require('./commands/killall'),
  require('./commands/links'),
  require('./commands/links/create'),
  require('./commands/links/destroy'),
  require('./commands/locks'),
  require('./commands/maintenance'),
  require('./commands/maintenance/run'),
  require('./commands/maintenance/window'),
  require('./commands/outliers'),
  require('./commands/promote'),
  require('./commands/ps'),
  require('./commands/psql'),
  require('./commands/pull'),
  require('./commands/repoint'),
  require('./commands/reset'),
  require('./commands/settings'),
  require('./commands/settings/auto_explain'),
  require('./commands/settings/auto_explain_log_analyze'),
  require('./commands/settings/auto_explain_log_buffers'),
  require('./commands/settings/auto_explain_log_min_duration'),
  require('./commands/settings/auto_explain_log_nested_statements'),
  require('./commands/settings/auto_explain_log_triggers'),
  require('./commands/settings/auto_explain_log_verbose'),
  require('./commands/settings/log_lock_waits'),
  require('./commands/settings/log_min_duration_statement'),
  require('./commands/settings/log_statement'),
  require('./commands/settings/track_functions'),
  require('./commands/unfollow'),
  require('./commands/upgrade'),
  require('./commands/vacuum_stats'),
  require('./commands/wait'),
])

exports.host = require('./lib/host')
exports.fetcher = require('./lib/fetcher')
exports.psql = require('./lib/psql')
