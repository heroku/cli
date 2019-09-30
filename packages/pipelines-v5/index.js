var flatten = require('lodash.flatten')

exports.topic = [
  { name: 'pipelines', description: 'manage collections of apps in pipelines' }
]

exports.commands = flatten([
  require('./commands/pipelines/setup.js')
])

exports.disambiguatePipeline = require('./lib/disambiguate')
