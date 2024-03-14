exports.commands = [
  require('./commands/cli'),
  require('./commands/wait'),
  require('./commands/promote'),
  require('./commands/timeout'),
  require('./commands/maintenance'),
  require('./commands/keyspace-notifications'),
  require('./commands/stats-reset'),
  require('./commands/upgrade'),
]

exports.topic = {
  name: 'redis',
  description: 'manage heroku redis instances',
}
