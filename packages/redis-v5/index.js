exports.commands = [
  require('./commands/cli'),
  require('./commands/wait'),
  require('./commands/promote'),
  require('./commands/timeout'),
  require('./commands/maintenance'),
]

exports.topic = {
  name: 'redis',
  description: 'manage heroku redis instances',
}
