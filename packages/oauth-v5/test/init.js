'use strict'

const cli = require('heroku-cli-util')
const nock = require('nock')
const chai = require('chai')
chai.use(require('chai-as-promised'))

cli.raiseErrors = true
nock.disableNetConnect()
