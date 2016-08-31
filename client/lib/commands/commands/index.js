'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run () {
  let {commands, topics} = require('../../..')
  cli.styledJSON({commands, topics})
}

module.exports = {
  topic: 'commands',
  flags: [{name: 'json'}],
  run: co.wrap(run)
}
