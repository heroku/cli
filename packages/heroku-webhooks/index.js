'use strict'
exports.topic = {
  name: 'webhooks',
  // this is the help text that shows up under `heroku help`
  description: 'setup HTTP notifications of app activity'
}

exports.commands = [
  require('./commands/webhooks/add.js'),
  require('./commands/webhooks/index.js'),
  require('./commands/webhooks/info.js'),
  require('./commands/webhooks/remove.js'),
  require('./commands/webhooks/update.js'),
  require('./commands/webhooks/events/index.js'),
  require('./commands/webhooks/events/info.js'),
  require('./commands/webhooks/deliveries/index.js'),
  require('./commands/webhooks/deliveries/info.js')
]
