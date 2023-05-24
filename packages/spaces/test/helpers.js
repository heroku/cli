'use strict'

// set column width to 80 so test runs are all consistent
global.columns = 80

let cli = require('heroku-cli-util')
cli.raiseErrors = true

let nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}
