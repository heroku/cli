'use strict'

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const chai = require('chai')
chai.use(require('chai-as-promised'))

cli.raiseErrors = true

nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}
