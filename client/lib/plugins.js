'use strict'

const co = require('co')
const dirs = require('./dirs')
const path = require('path')
const Promise = require('bluebird')
const npmi = Promise.promisify(require('npmi'))
const fs = Promise.promisifyAll(require('fs-extra'))

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

function getCache () {
  return fs.readJSONAsync(cachePath)
  .catch(() => [])
}

function writeCache (cache) {
  return fs.writeJSONAsync(cachePath, cache)
}

function * parse (ref, pkg) {
  let plugin = require(pkg[1])
  plugin.ref = ref
  plugin.name = pkg[0].split('@')[0]
  plugin.version = pkg[0].split('@')[1]
  if (!plugin.commands) throw new Error(`${ref} does not appear to be a Heroku CLI plugin`)
  let cache = yield getCache()
  let idx = cache.findIndex(p => p.name === plugin.name)
  if (idx !== -1) cache[idx] = plugin
  else cache.push(plugin)
  yield writeCache(cache)
}

function * install (ref) {
  let {name, scope, version} = readRef(ref)

  let packages = yield npmi({
    name: scope ? `${scope}/${name}` : name,
    version,
    path: path.join(dirs.data, 'plugins'),
    forceInstall: true
  })
  let pkg = packages.pop() // plugin is last installed package
  yield parse(ref, pkg)
}

module.exports = {
  install: co.wrap(install)
}
