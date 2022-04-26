'use strict'

const cli = require('heroku-cli-util')
cli.raiseErrors = true

global.commands = require('../index').commands

global.apikey = process.env.HEROKU_API_KEY

process.stdout.isTTY = false
