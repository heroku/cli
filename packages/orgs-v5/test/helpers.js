'use strict'
/* globals nock cli */

global.columns = 80
global.cli = require('heroku-cli-util')
global.expect = require('chai').expect
global.nock = require('nock')
nock.disableNetConnect()
cli.raiseErrors = true
cli.color.enabled = false
