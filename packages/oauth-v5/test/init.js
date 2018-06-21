'use strict'

const cli = require('heroku-cli-util')
const nock = require('nock')

cli.raiseErrors = true
nock.disableNetConnect()
