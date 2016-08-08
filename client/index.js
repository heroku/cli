'use strict'

const plugins = require('./lib/plugins')
const {topics, commands} = plugins.load()

exports.topics = topics.concat([{
  name: 'plugins',
  description: 'manage CLI plugins'
}])

exports.commands = require('./lib/commands').concat(commands)
