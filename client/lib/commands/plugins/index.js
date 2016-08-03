'use strict'

const co = require('co')
const plugins = require('../../plugins')
const cli = require('heroku-cli-util')

function * run (context) {
  cli.styledHeader('Installed Plugins')
  for (let plugin of plugins.get()) {
    cli.log(`${plugin.name}@${plugin.version}`)
  }
}

module.exports = {
  topic: 'plugins',
  run: co.wrap(run)
}
