var fs = require('fs')
var path = require('path')
var flatten = require('lodash.flatten')

exports.topic = {
  name: 'pipelines',
  // this is the help text that shows up under `heroku help`
  description: 'manage collections of apps in pipelines'
}

var normalizedPath = path.join(__dirname, 'commands/pipelines')

exports.commands = flatten(fs.readdirSync(normalizedPath).map(function (file) {
  return require('./commands/pipelines/' + file)
}))
