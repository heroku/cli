'use strict'

// function requirePlugin (plugin) {
//   let {topics, topic, commands} = require(plugin)
//   if (topics) exports.topics = exports.topics.concat(topics)
//   if (topic) exports.topics.push(topic)
//   exports.commands = exports.commands.concat(commands)
// }

const plugins = require('./lib/plugins')
let {topics, commands} = plugins.load()
topics = topics.concat([{
  name: 'plugins',
  description: 'manage CLI plugins'
}])
commands = commands.concat(require('./lib/commands'))

// requirePlugin('heroku-apps')
// requirePlugin('heroku-git')

function compare (prop) {
  return (a, b) => {
    if (a[prop] < b[prop]) return -1
    if (a[prop] > b[prop]) return 1
    return 0
  }
}
topics.sort(compare('name'))
commands.sort((a, b) => {
  if (a.topic < b.topic) return -1
  if (a.topic > b.topic) return 1
  if (a.command < b.command) return -1
  if (a.command > b.command) return 1
  return 0
})

exports.topics = topics
exports.commands = commands
