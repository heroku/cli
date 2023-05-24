'use strict'

process.env.HEROKU_HIDE_HEXAGON = '1'

let cli = require('heroku-cli-util')
cli.raiseErrors = true // Fully raise exceptions
global.commands = require('../src').commands // Load plugin commands
process.env.TZ = 'UTC' // Use UTC time always
require('mockdate').set(new Date()) // Freeze time
process.stdout.columns = 80 // Set screen width for consistent wrapping
process.stderr.columns = 80 // Set screen width for consistent wrapping

let nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === true) {
  nock.enableNetConnect()
}
