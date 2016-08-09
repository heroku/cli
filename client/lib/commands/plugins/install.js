'use strict'

const co = require('co')
const plugins = require('../../plugins')

function * run () {
  const ref = this.args.plugin
  yield plugins.install(ref)
}

module.exports = {
  topic: 'plugins',
  command: 'install',
  description: 'install a plugin',
  args: [{name: 'plugin'}],
  run: co.wrap(run)
}
