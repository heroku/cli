'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run () {
  process.argv = ['', 'heroku local', '--version']
  require('foreman/nf.js')
}

module.exports = {
  topic: 'local',
  command: 'version',
  description: 'display node-foreman version',
  help: 'Display node-foreman version',
  run: cli.command(co.wrap(run))
}
