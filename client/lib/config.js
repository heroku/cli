'use strict'

const fs = require('fs-extra')
const path = require('path')
const os = require('os')

class Config {
  constructor () {
    this._path = path.join(os.homedir(), '.config', 'heroku', 'config.json')
    this._read()
  }

  toString () {
    return this._config.toString()
  }

  _write () {
    fs.writeJsonSync(this._path, this._config)
  }

  _read () {
    this._config = fs.readJsonSync(this._path)
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
