'use strict'

const cli = require('heroku-cli-util')
const nock = require('nock')

global.commands = require('..').commands
cli.raiseErrors = true
nock.disableNetConnect()
