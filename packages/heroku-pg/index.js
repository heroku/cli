'use strict'

exports.topics = [
  {name: 'pg', description: 'manage postgresql databases'}
]

exports.commands = [
  require('./commands/info').info,
  require('./commands/info').root,
  require('./commands/wait')
]
