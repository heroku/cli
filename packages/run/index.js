'use strict'

const path = require('path')
const fs = require('fs')

exports.topics = [{
  name: 'run',
  description: 'run a one-off process inside a Heroku dyno'
}, {
  name: 'logs',
  description: 'display recent log output'
}]

exports.commands = fs.readdirSync(path.join(__dirname, 'commands'))
  .filter(f => path.extname(f) === '.js')
  .map(f => require('./commands/' + f))

exports.Dyno = require('./lib/dyno')
