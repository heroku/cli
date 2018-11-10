'use strict'
/* globals cli */

global.cli = require('heroku-cli-util')
cli.raiseErrors = true

let chai = require('chai')
let chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

process.stdout.columns = 80
process.stderr.columns = 80

let nock = require('nock')
nock.disableNetConnect()
