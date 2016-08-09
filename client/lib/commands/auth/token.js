'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run () {
  cli.log(this.auth.password)
}

module.exports = {
  topic: 'auth',
  command: 'token',
  description: 'display the current authentication token',
  before: [cli.auth],
  run: co.wrap(run)
}
