'use strict'
/* globals cli nock */

const chai = require('chai')
chai.use(require('chai-as-promised'))

global.cli = require('heroku-cli-util')
global.commands = require('..').commands
global.expect = chai.expect
global.nock = require('nock')
cli.raiseErrors = true
process.stdout.columns = 80
process.stderr.columns = 80
nock.disableNetConnect()

if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}
