const os = require('os')
const path = require('path')
const home = os.homedir()

function exists (dir) {
  const fs = require('fs')
  return fs.existsSync(dir)
}

function mkdirp (dir) {
  if (exists(dir)) return
  const fs = require('fs-extra')
  fs.mkdirpSync(dir)
}

const windows = os.platform === 'win32'

let data = process.env.XDG_DATA_HOME
let cache = process.env.XDG_CACHE_HOME
let config = process.env.XDG_CONFIG_HOME

if (windows) {
  data = process.env.LOCALAPPDATA
  cache = process.env.LOCALAPPDATA
  config = process.env.LOCALAPPDATA
} else {
  data = data || path.join(home, '.local', 'share')
  cache = cache || path.join(home, '.cache')
  config = config || path.join(home, '.config')
}

data = path.join(data, 'heroku')
cache = path.join(cache, 'heroku')
config = path.join(config, 'heroku')

mkdirp(data)
mkdirp(cache)
mkdirp(config)

exports.home = home
exports.data = data
exports.cache = cache
exports.config = config
exports.lockfile = path.join(cache, 'lock')
