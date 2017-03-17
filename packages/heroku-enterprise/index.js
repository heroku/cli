'use strict'

exports.topics = [
  { name: 'enterprise', description: 'manage enterprise accounts' }
]

exports.commands = [
  require('./commands/enterprises'),
  require('./commands/enterprises/create'),
  require('./commands/enterprises/members'),
  require('./commands/enterprises/members-add'),
  require('./commands/enterprises/members-remove'),
  require('./commands/enterprises/usage'),
  require('./commands/teams'),
  require('./commands/teams/transfer')
]
