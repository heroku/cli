'use strict'

/* globals chai */

process.env.XDG_DATA_HOME = 'tmp'
process.env.XDG_CONFIG_HOME = 'tmp'
process.env.XDG_CACHE_HOME = 'tmp'
const cli = require('heroku-cli-util')
cli.color.enabled = false
global.chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()
