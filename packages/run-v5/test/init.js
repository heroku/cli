'use strict'

const cli = require('@heroku/heroku-cli-util')
cli.raiseErrors = true

global.commands = require('../index').commands

global.apikey = process.env.HEROKU_API_KEY

process.stdout.isTTY = false

let nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}
