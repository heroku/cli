'use strict'

let _ = require('lodash')

exports.topic = {
  name: 'heroku',
  // this is the help text that shows up under `heroku help`
  description: 'a topic for the ssl plugin'
}

exports.commands = _.flatten([
  require('./commands/certs/index.js'),
  require('./commands/certs/add.js'),
  require('./commands/certs/chain.js'),
  require('./commands/certs/generate.js'),
  require('./commands/certs/info.js'),
  require('./commands/certs/key.js'),
  require('./commands/certs/remove.js'),
  require('./commands/certs/rollback.js'),
  require('./commands/certs/update.js')
])
