const dirs = require('./dirs')
const path = require('path')
const fs = require('fs-extra')
const version = require('./version')

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

let cache = {version, plugins: {}}
let cacheUpdated = false
let cacheFile = path.join(dirs.cache, 'plugins.json')
try {
  cache = fs.readJSONSync(cacheFile)
  if (cache.version !== version || version === 'dev') cache = {version, plugins: {}}
} catch (err) {
  if (err.code !== 'ENOENT') throw err
}
function savePluginCache () {
  fs.writeJSONSync(cacheFile, cache)
}

function registerPlugin (type) {
  return plugin => {
    function requirePlugin (plugin) {
      if (!cache.plugins[plugin]) {
        let info = require(plugin)
        let pjson = type === 'builtin'
          ? {}
          : require(path.join(plugin, 'package.json'))
        cache.plugins[plugin] = {
          plugin,
          version: pjson.version,
          name: pjson.name,
          type,
          topics: (info.topics || []).map(t => ({
            name: t.name,
            description: t.description,
            hidden: t.hidden
          })),
          commands: info.commands.map(c => ({
            topic: c.topic,
            command: c.command,
            description: c.description,
            args: c.args,
            flags: c.flags
          }))
        }
        cacheUpdated = true
      }
      cache.plugins[plugin].fetch = () => require(plugin)
      for (let c of cache.plugins[plugin].commands) c.fetch = () => require(plugin).commands.find(r => r.topic === c.topic && r.command === c.command)
      return cache.plugins[plugin]
    }

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
}

registerPlugin('builtin')('../commands')
core.forEach(registerPlugin('core'))
userPlugins().map(p => path.join(dirs.plugins, 'node_modules', p)).forEach(registerPlugin('user'))

if (cacheUpdated) savePluginCache()

exports.clearCache = plugin => {
  delete cache.plugins[plugin]
  savePluginCache()
}

exports.list = () => {
  return cache.plugins
}
