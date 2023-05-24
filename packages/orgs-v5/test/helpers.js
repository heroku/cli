'use strict'
/* globals nock cli */

global.apikey = process.env.HEROKU_API_KEY
global.columns = 80
global.cli = require('heroku-cli-util')
global.expect = require('chai').expect
global.nock = require('nock')
cli.raiseErrors = true
cli.color.enabled = false
nock.disableNetConnect()

if (process.env.ENABLE_NET_CONNECT === true) {
  nock.enableNetConnect()
}
