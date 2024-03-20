exports.commands = [
  require('./commands/wait'),
  require('./commands/promote'),
]

exports.topic = {
  name: 'redis',
  description: 'manage heroku redis instances',
}
