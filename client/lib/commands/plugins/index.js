'use strict'

const co = require('co')
const config = require('../../config')
const cli = require('heroku-cli-util')

function * run (context) {
  cli.styledHeader('Installed Plugins')
  for (let plugin of config.plugins) {
    cli.log(plugin)
  }
}

module.exports = {
  topic: 'plugins',
  run: co.wrap(run)
}
