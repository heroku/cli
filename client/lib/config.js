'use strict'

const fs = require('fs-extra')
const path = require('path')
const debug = require('debug')('config')
const dirs = require('./dirs')

class Config {
  constructor () {
    this._defaults = {
      skip_analytics: false,
      color: true,
      plugins: []
    }
    this._path = path.join(dirs.config, 'config.json')
    this._read()
  }

  toString () {
    return this._config.toString()
  }

  _write () {
    fs.writeJsonSync(this._path, this._config)
  }

  _read () {
    try {
      this._config = fs.readJSONSync(this._path)
    } catch (err) {
      debug(err)
      this._config = this._defaults
      this._write()
    }
  }
}

module.exports = new Proxy(new Config(), {
  get: function (target, name) {
    if (name in target) return target[name]
    return target._config[name]
  },

  set: function (target, name, value) {
    if (name in target) target[name] = value
    else {
      target._config[name] = value
      target._write()
    }
    return true
  }
})
