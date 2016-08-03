'use strict'

exports.topics = [{
  name: 'plugins',
  description: 'manage CLI plugins'
}]

exports.commands = require('./lib/commands')
