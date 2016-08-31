'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run () {
  cli.styledJSON(require('../../..').commands)
}

module.exports = {
  topic: 'commands',
  run: co.wrap(run)
}
