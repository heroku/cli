exports.commands = [
  require('./commands/wait'),
  require('./commands/promote'),
  require('./commands/timeout'),
  require('./commands/maintenance'),
  require('./commands/stats-reset'),
]

exports.topic = {
  name: 'redis',
  description: 'manage heroku redis instances',
}
