exports.topic = {
  name: 'status',
  description: 'status of the Heroku platform'
}

exports.commands = [
  require('./commands/status')
]
