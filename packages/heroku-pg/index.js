'use strict'

exports.topics = [
  {name: 'pg', description: 'manage postgresql databases'}
]

exports.commands = [
  require('./commands/pg')
]
