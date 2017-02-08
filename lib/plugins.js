'use strict'

const plugins = [
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

const flatten = list => list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])

function compare (prop) {
  return (a, b) => {
    if (a[prop] < b[prop]) return -1
    if (a[prop] > b[prop]) return 1
    return 0
  }
}

class Plugins extends Array {
  constructor () {
    super()
    this._plugins = [require('./commands')]
    this._refresh()
  }

  load () {
    while (plugins.length) this._plugins.push(require(plugins.pop()))
    this._refresh()
    return this
  }

  _refresh () {
    this.topics = flatten(this._plugins.map(p => p.topics)).filter(t => t).sort(compare('name'))
    this.commands = flatten(this._plugins.map(p => p.commands)).filter(t => t)
  }
}

module.exports = new Plugins()
