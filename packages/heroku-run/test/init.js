'use strict'

const cli = require('heroku-cli-util')
cli.raiseErrors = true

const nock = require('nock')
nock.disableNetConnect()

global.commands = require('../index').commands
