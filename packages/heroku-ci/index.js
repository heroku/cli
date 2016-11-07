const fs = require('fs')
const path = require('path')

exports.topic = {
  name: 'ci',
  description: 'run an application test suite on Heroku'
}

const commands = path.join(__dirname, 'commands/ci')

exports.commands = fs.readdirSync(commands).map((file) => {
  return require(path.join(commands, file))
})
