'use strict'

exports.topics = [
  {name: 'spaces', description: 'manage heroku private spaces'},
  {name: 'trusted-ips', hidden: true},
]

exports.commands = [
  require('./commands/vpn/connect'),
  require('./commands/vpn/index'),
  require('./commands/vpn/wait'),
  require('./commands/vpn/destroy'),
  require('./commands/vpn/update'),
  require('./commands/drains/get'),
  require('./commands/trusted-ips'),
]
