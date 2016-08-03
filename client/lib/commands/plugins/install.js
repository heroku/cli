'use strict'

const co = require('co')
const config = require('../../config')
const cli = require('heroku-cli-util')

function * run (context) {
  const plugin = context.args.plugin

  cli.action(`Installing plugin ${cli.color.cyan(plugin)}`, co(function * () {
    config.plugins.push(plugin)
  }))
}

module.exports = {
  topic: 'plugins',
  command: 'install',
  args: [{name: 'plugin'}],
  run: co.wrap(run)
}
