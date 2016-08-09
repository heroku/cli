'use strict'

/* globals chai */

const cli = require('heroku-cli-util')
cli.color.enabled = false
global.chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()
