'use strict'

exports.topics = [
  {name: 'spaces', description: 'manage heroku private spaces'},
  {name: 'trusted-ips', hidden: true},
]

exports.commands = [
  require('./commands/vpn/index'),
  require('./commands/vpn/wait'),
  require('./commands/vpn/update'),
]
