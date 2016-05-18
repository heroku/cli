'use strict'

const cli = require('heroku-cli-util')
cli.raiseErrors = true

global.commands = require('../index').commands

global.apikey = process.env.HEROKU_API_KEY
if (!global.apikey) global.apikey = require('netrc')()['api.heroku.com'].password
