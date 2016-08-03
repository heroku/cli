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
  if (!d) d = path.join(os.homedir(), '.local', 'share', 'heroku')
  return d
}

function config () {
  let d = env.XDG_CONFIG_HOME
  if (!d) d = windowsLocalAppData()
  if (!d) d = path.join(os.homedir(), '.config', 'heroku')
  return d
}

function cache () {
  let d = env.XDG_CACHE_HOME
  if (!d) d = windowsLocalAppData()
  if (!d) d = path.join(os.homedir(), '.cache', 'heroku')
  return d
}

module.exports = {
  data: data(),
  config: config(),
  cache: cache()
}
