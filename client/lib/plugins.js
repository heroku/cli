'use strict'

const dirs = require('./dirs')
const path = require('path')
const json = require('./json')

function readRef (ref) {
  let name = ref
  let scope, version

  if (name[0] === '@') {
    let idx = ref.indexOf('/')
    scope = ref.slice(0, idx)
    name = ref.slice(idx + 1)
  }

  if (name.indexOf('@') !== -1) {
    [name, version] = name.split('@')
  }

  return {name, scope, version}
}

let cachePath = path.join(dirs.data, 'plugins', 'plugins.json')

function get () {
  return json.readJSON(cachePath)
}

function getCommands () {
  let commands = []
  for (let plugin of get()) {
    for (let command of plugin.commands) {
      command.run = context => {
        return require(path.join(dirs.data, 'plugins', 'node_modules', plugin.name))
        .commands.find(c => c.topic === command.topic && c.command === command.command)
        .run(context)
      }
      commands.push(command)
    }
  }
  return commands
}

function put (cache) {
  cache.sort((a, b) => a.name > b.name)
  return json.writeJSON(cachePath, cache)
}

function parse (ref, pkg) {
  let plugin = require(pkg[1])
  plugin.ref = ref
  plugin.name = pkg[0].split('@')[0]
  plugin.version = pkg[0].split('@')[1]
  if (!plugin.commands) throw new Error(`${ref} does not appear to be a Heroku CLI plugin`)
  let plugins = get()
  let idx = plugins.findIndex(p => p.name === plugin.name)
  if (idx !== -1) plugins[idx] = plugin
  else plugins.push(plugin)
  put(plugins)
}

function install (ref) {
  return new Promise((resolve, reject) => {
    const npmi = require('npmi')
    let {name, scope, version} = readRef(ref)

    npmi({
      name: scope ? `${scope}/${name}` : name,
      version,
      path: path.join(dirs.data, 'plugins'),
      forceInstall: true
    }, (err, packages) => {
      if (err) return reject(err)
      let pkg = packages.pop() // plugin is last installed package
      parse(ref, pkg)
      resolve()
    })
  })
}

module.exports = {
  install,
  get,
  getCommands
}
