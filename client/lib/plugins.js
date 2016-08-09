'use strict'

const dirs = require('./dirs')
const path = require('path')
const json = require('./json')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const co = require('co')
const cli = require('heroku-cli-util')

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
  try {
    return json.readJSON(cachePath)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    return []
  }
}

function load () {
  let commands = []
  let topics = []
  for (let plugin of get()) {
    for (let command of plugin.commands) {
      command.run = context => {
        return require(path.join(dirs.data, 'plugins', 'node_modules', plugin.name))
        .commands.find(c => c.topic === command.topic && c.command === command.command)
        .run(context)
      }
      commands.push(command)
    }
    for (let topic of (plugin.topics || [])) {
      topics.push(topic)
    }
    if (plugin.topic) topics.push(plugin.topic)
  }
  return {commands, topics}
}

function put (cache) {
  return json.writeJSON(cachePath, cache)
}

function parse (ref, pkg) {
  let plugin = require(path.resolve(pkg[1]))
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

let registry = process.env.HEROKU_NPM_REGISTRY || 'https://cli-npm.heroku.com'
let npmConfig = {
  registry,
  progress: false,
  loglevel: 'error'
}

function install (ref) {
  return new Promise((resolve, reject) => {
    const npmi = require('npmi')
    let {name, scope, version} = readRef(ref)
    fs.ensureDirSync(path.join(dirs.data, 'plugins'))

    npmi({
      name: scope ? `${scope}/${name}` : name,
      version,
      path: path.join(dirs.data, 'plugins'),
      forceInstall: true,
      npmLoad: npmConfig
    }, (err, packages) => {
      if (err) return reject(err)
      let pkg = packages.pop() // plugin is last installed package
      parse(ref, pkg)
      resolve()
    })
  })
}

function uninstall (name) {
  fs.removeSync(path.join(dirs.data, 'plugins', 'node_modules', name))
  let plugins = get().filter(p => p.name !== name)
  put(plugins)
}

function npmInfo (name) {
  const npm = require('npm')

  return new Promise((resolve, reject) => {
    npm.load(npmConfig, err => {
      if (err) return reject(err)
      npm.commands.view([name], true, (err, data) => {
        if (err) return reject(err)
        resolve(data[Object.keys(data)[0]])
      })
    })
  })
}

function * update () {
  let plugins = get()
  for (let plugin of plugins) {
    let info = yield npmInfo(plugin.name)
    let ref = readRef(plugin.ref || plugin.name)
    let dist = ref.version || 'latest'
    let latest = info['dist-tags'][dist] || info['dist-tags']['latest']
    if (latest !== plugin.version) {
      cli.action(`Updating ${plugin.ref || plugin.name}`, co(function * () {
        yield install(plugin.ref || plugin.name)
      }))
    }
  }
}

module.exports = {
  get,
  install,
  load,
  uninstall,
  update: co.wrap(update)
}
