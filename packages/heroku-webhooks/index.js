'use strict'
exports.topic = {
  name: 'webhooks',
  // this is the help text that shows up under `heroku help`
  description: 'setup HTTP notifications of app activity',
}

exports.commands = [
  require('./commands/webhooks/add.js'),
  require('./commands/webhooks'),
  require('./commands/webhooks/info.js'),
  require('./commands/webhooks/remove.js'),
  require('./commands/webhooks/update.js'),
  require('./commands/webhooks/events'),
  require('./commands/webhooks/events/info.js'),
  require('./commands/webhooks/deliveries'),
  require('./commands/webhooks/deliveries/info.js'),
]
