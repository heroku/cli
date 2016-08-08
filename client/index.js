'use strict'

function requirePlugin (plugin) {
  let {topics, topic, commands} = require(plugin)
  if (topics) exports.topics = exports.topics.concat(topics)
  if (topic) exports.topics.push(topic)
  exports.commands = exports.commands.concat(commands)
}

const plugins = require('./lib/plugins')
const {topics, commands} = plugins.load()
exports.topics = topics.concat([{
  name: 'plugins',
  description: 'manage CLI plugins'
}])
exports.commands = require('./lib/commands').concat(commands)

requirePlugin('heroku-apps')
requirePlugin('heroku-git')

exports.commands.sort((a, b) => a.command > b.command)
exports.topics.sort((a, b) => a.name > b.name)
