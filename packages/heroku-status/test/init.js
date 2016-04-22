'use strict'
process.env.TZ = 'UTC'

let cli = require('heroku-cli-util')
let nock = require('nock')

cli.raiseErrors = true
nock.disableNetConnect()
