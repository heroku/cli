'use strict'

let cli = require('heroku-cli-util')
cli.raiseErrors = true

const nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}
