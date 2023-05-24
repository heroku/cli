'use strict'
/* globals cli */

global.cli = require('heroku-cli-util')
cli.raiseErrors = true
cli.color.enabled = false

process.stdout.columns = 80
process.stderr.columns = 80

let nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === true) {
  nock.enableNetConnect()
}
