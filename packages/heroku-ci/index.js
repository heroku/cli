const fs = require('fs')
const path = require('path')
const flatten = require('lodash.flatten')

exports.topic = {
  name: 'ci',
  description: 'run an application test suite on Heroku'
}

const commands = path.join(__dirname, 'commands/ci')

exports.commands = flatten(fs.readdirSync(commands).map((file) => {
  return require(path.join(commands, file))
}))
