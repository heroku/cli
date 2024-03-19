exports.commands = [
  require('./commands/wait'),
]

exports.topic = {
  name: 'redis',
  description: 'manage heroku redis instances',
}
