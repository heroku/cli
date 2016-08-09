'use strict'

/* globals chai */

const cli = require('heroku-cli-util')
const nock = require('nock')
nock.disableNetConnect()
cli.color.enabled = false
global.chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()
