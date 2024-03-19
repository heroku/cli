exports.commands = [
  require('./commands/promote'),
  require('./commands/timeout'),
]

exports.topic = {
  name: 'redis',
  description: 'manage heroku redis instances',
}
