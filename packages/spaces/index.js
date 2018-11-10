'use strict'

exports.topics = [
  { name: 'spaces', description: 'manage heroku private spaces' },
  { name: 'trusted-ips', hidden: true }
]

exports.commands = [
  require('./commands'),
  require('./commands/create'),
  require('./commands/destroy'),
  require('./commands/info'),
  require('./commands/rename'),
  require('./commands/wait'),
  require('./commands/peering/info'),
  require('./commands/peering/index'),
  require('./commands/peering/accept'),
  require('./commands/peering/destroy'),
  require('./commands/vpn/connect'),
  require('./commands/vpn/index'),
  require('./commands/vpn/info'),
  require('./commands/vpn/config'),
  require('./commands/vpn/wait'),
  require('./commands/vpn/destroy'),
  require('./commands/ps'),
  require('./commands/topology'),
  require('./commands/drains/get'),
  require('./commands/drains/set'),
  require('./commands/trusted-ips'),
  require('./commands/trusted-ips/add'),
  require('./commands/trusted-ips/remove'),
  require('./commands/outbound-rules'),
  require('./commands/outbound-rules/add'),
  require('./commands/outbound-rules/remove')
]
