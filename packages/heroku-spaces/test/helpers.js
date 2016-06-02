'use strict'

let cli = require('heroku-cli-util')
cli.raiseErrors = true

let nock = require('nock')
nock.disableNetConnect()
