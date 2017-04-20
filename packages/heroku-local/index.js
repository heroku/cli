'use strict'

const flatten = require('lodash.flatten')

exports.topic = {
  name: 'local',
  description: 'run heroku app locally'
}

exports.commands = flatten([
  require('./commands/start'),
  require('./commands/run'),
  require('./commands/version')
])
