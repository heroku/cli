exports.commands = [
  require('./commands/index'),
  require('./commands/cli'),
  require('./commands/info'),
  require('./commands/wait'),
  require('./commands/credentials'),
  require('./commands/promote'),
  require('./commands/timeout'),
  require('./commands/maxmemory'),
  require('./commands/maintenance'),
  require('./commands/keyspace-notifications'),
  require('./commands/stats-reset'),
]

exports.topic = {
  name: 'redis',
  description: 'manage heroku redis instances'
}
