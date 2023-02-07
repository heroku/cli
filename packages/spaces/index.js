'use strict'

exports.topics = [
  { name: 'spaces', description: 'manage heroku private spaces' },
  { name: 'trusted-ips', hidden: true }
]

exports.commands = [
  require('./commands/spaces'),
  require('./commands/spaces/create'),
  require('./commands/spaces/destroy'),
  require('./commands/spaces/info'),
  require('./commands/spaces/rename'),
  require('./commands/spaces/wait'),
  require('./commands/spaces/peering/info'),
  require('./commands/spaces/peerings'),
  require('./commands/spaces/peerings/accept'),
  require('./commands/spaces/peerings/destroy'),
  require('./commands/spaces/vpn/connect'),
  require('./commands/spaces/vpn/index'),
  require('./commands/spaces/vpn/info'),
  require('./commands/spaces/vpn/config'),
  require('./commands/spaces/vpn/wait'),
  require('./commands/spaces/vpn/destroy'),
  require('./commands/spaces/vpn/update'),
  require('./commands/spaces/ps'),
  require('./commands/spaces/transfer'),
  require('./commands/spaces/topology'),
  require('./commands/spaces/drains/get'),
  require('./commands/spaces/drains/set'),
  require('./commands/trusted-ips'),
  require('./commands/trusted-ips/add'),
  require('./commands/trusted-ips/remove'),
  require('./commands/spaces/outbound-rules'),
  require('./commands/spaces/outbound-rules/add'),
  require('./commands/spaces/outbound-rules/remove'),
  require('./commands/spaces/hosts')
]
