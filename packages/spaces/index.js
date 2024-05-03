'use strict'

exports.topics = [
  {name: 'spaces', description: 'manage heroku private spaces'},
  {name: 'trusted-ips', hidden: true},
]

exports.commands = [
  require('./commands/peering/index'),
  require('./commands/peering/destroy'),
  require('./commands/vpn/connect'),
  require('./commands/vpn/index'),
  require('./commands/vpn/info'),
  require('./commands/vpn/config'),
  require('./commands/vpn/wait'),
  require('./commands/vpn/destroy'),
  require('./commands/vpn/update'),
  require('./commands/drains/get'),
  require('./commands/trusted-ips'),
  require('./commands/trusted-ips/remove'),
  require('./commands/hosts'),
]
