'use strict'
/* globals cli */

global.cli = require('heroku-cli-util')
cli.raiseErrors = true
cli.color.enabled = false

let nock = require('nock')
nock.disableNetConnect()
