'use strict'

exports.topics = [
  {name: 'authorizations', description: 'OAuth authorizations'},
  {name: 'clients', description: 'OAuth clients on the platform'},
  {name: 'sessions', description: 'OAuth sessions'}
]

exports.commands = [
  require('./commands/authorizations'),
  require('./commands/authorizations/create'),
  require('./commands/authorizations/info'),
  require('./commands/authorizations/revoke'),
  require('./commands/authorizations/update'),
  require('./commands/authorizations/rotate'),
  require('./commands/clients'),
  require('./commands/clients/create'),
  require('./commands/clients/destroy'),
  require('./commands/clients/info'),
  require('./commands/clients/update'),
  require('./commands/clients/rotate'),
  require('./commands/sessions'),
  require('./commands/sessions/destroy')
]
