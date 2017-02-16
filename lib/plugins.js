const dirs = require('./dirs')
const path = require('path')
const fs = require('fs-extra')

const core = [
  'heroku-apps',
  'heroku-certs',
  'heroku-cli-addons',
  'heroku-fork',
  'heroku-git',
  'heroku-local',
  'heroku-orgs',
  'heroku-pg',
  'heroku-pipelines',
  'heroku-redis',
  'heroku-run',
  'heroku-spaces',
  'heroku-status'
]

function userPlugins () {
  try {
    let pjson = fs.readJSONSync(path.join(dirs.plugins, 'package.json'))
    return Object.keys(pjson.dependencies)
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

exports.commands = {}
exports.topics = {}

let cache = {}
let cacheUpdated = false
let cacheFile = path.join(dirs.cache, 'plugins.json')
try {
  cache = fs.readJSONSync(cacheFile)
} catch (err) {
  if (err.code !== 'ENOENT') throw err
}

function requirePlugin (plugin) {
  if (!cache[plugin]) {
    let info = require(plugin)
    cache[plugin] = {
      plugin,
      topics: (info.topics || []).map(t => ({
        name: t.name,
        description: t.description,
        hidden: t.hidden
      })),
      commands: info.commands.map(c => ({
        topic: c.topic,
        command: c.command
      }))
    }
    cacheUpdated = true
  }
  cache[plugin].fetch = () => require(plugin)
  for (let c of cache[plugin].commands) c.fetch = () => require(plugin).commands.find(r => r.topic === c.topic && r.command === c.command)
  return cache[plugin]
}

function registerPlugin (plugin) {
  function registerTopic (topic) {
    let current = exports.topics[topic.name]
    if (current) {
      current.description = current.description || topic.description
    } else {
      exports.topics[topic.name] = topic
    }
  }

  function registerCommand (command) {
    if (!command.topic) return
    let names = command.command ? [`${command.topic}:${command.command}`] : [command.topic]
    names = names.concat(command.aliases || [])
    if (command.default) names.push(command.topic)
    for (let name of names) {
      if (exports.commands[name]) console.error(`WARNING: command ${name} is already defined`)
      exports.commands[name] = command
    }
    registerTopic({name: command.topic})
  }

  plugin = requirePlugin(plugin)
  if (plugin.topics) plugin.topics.forEach(registerTopic)
  plugin.commands.forEach(registerCommand)
}

userPlugins().map(p => path.join(dirs.plugins, 'node_modules', p))
.concat(core)
.concat(['../commands'])
.forEach(registerPlugin)

if (cacheUpdated) fs.writeJSONSync(cacheFile, cache)
