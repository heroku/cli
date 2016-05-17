'use strict'

const cli = require('heroku-cli-util')

function display (auth) {
  cli.styledObject(auth)
}

module.exports = {
  display
}
