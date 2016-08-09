'use strict'

const path = require('path')
const os = require('os')
const env = process.env

function windowsLocalAppData () {
  if (os.platform() === 'win32') return env.LOCALAPPDATA
}

function data () {
  let d = env.XDG_DATA_HOME
  if (!d) d = windowsLocalAppData()
  if (!d) d = path.join(os.homedir(), '.local')
  return path.join(d, 'share', 'heroku')
}

function config () {
  let d = env.XDG_CONFIG_HOME
  if (!d) d = windowsLocalAppData()
  if (!d) d = path.join(os.homedir(), '.config')
  return path.join(d, 'heroku')
}

function cache () {
  let d = env.XDG_CACHE_HOME
  if (!d) d = windowsLocalAppData()
  if (!d) d = path.join(os.homedir(), '.cache')
  return path.join(d, 'heroku')
}

module.exports = {
  get data () { return data() },
  get config () { return config() },
  get cache () { return cache() }
}
