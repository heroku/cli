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

function compare (prop) {
  return (a, b) => {
    if (a[prop] < b[prop]) return -1
    if (a[prop] > b[prop]) return 1
    return 0
  }
}
exports.topics.sort(compare('name'))
exports.commands.sort((a, b) => {
  if (a.topic < b.topic) return -1
  if (a.topic > b.topic) return 1
  if (a.command < b.command) return -1
  if (a.command > b.command) return 1
  return 0
})
