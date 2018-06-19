'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run () {
  let execArgv = ['--version']
  yield require('../lib/fork_foreman')(execArgv)
}

module.exports = {
  topic: 'local',
  command: 'version',
  description: 'display node-foreman version',
  run: cli.command(co.wrap(run))
}
