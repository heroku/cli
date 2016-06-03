'use strict'

exports.topics = [
  {name: 'spaces', description: 'manage heroku private spaces'},
  {name: 'trusted-ips', hidden: true}
]

exports.commands = [
  require('./commands'),
  require('./commands/create'),
  require('./commands/destroy'),
  require('./commands/info'),
  require('./commands/rename'),
  require('./commands/drains/get'),
  require('./commands/drains/set'),
  require('./commands/trusted-ips'),
  require('./commands/trusted-ips/add'),
  require('./commands/trusted-ips/remove'),
  require('./commands/outbound-rules'),
  require('./commands/outbound-rules/add'),
  require('./commands/outbound-rules/remove')
]
