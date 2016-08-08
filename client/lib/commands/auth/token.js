'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context) {
  cli.log(context.auth.password)
}

module.exports = {
  topic: 'auth',
  command: 'token',
  description: 'display the current authentication token',
  before: [cli.auth],
  run: co.wrap(run)
}
