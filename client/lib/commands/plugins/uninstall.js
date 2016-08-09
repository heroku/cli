'use strict'

const co = require('co')
const plugins = require('../../plugins')
const cli = require('heroku-cli-util')

function * run () {
  let {plugin} = this.args
  cli.action(`Uninstalling ${cli.color.cyan(plugin)}`, co(function * () {
    if (!plugins.get().find(p => p.name === plugin)) throw new Error('plugin not installed')
    plugins.uninstall(plugin)
  }))
}

module.exports = {
  topic: 'plugins',
  command: 'uninstall',
  description: 'remove a plugin',
  args: [{name: 'plugin'}],
  run: co.wrap(run)
}
