exports.topic = {
  name: 'local',
  description: 'run heroku app locally'
}

exports.commands = [
  require('./commands/start'),
  require('./commands/run'),
  require('./commands/version')
]
