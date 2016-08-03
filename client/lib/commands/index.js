'use strict'

const fs = require('fs')
const flatten = require('lodash.flatten')
const path = require('path')

function commandsInDir (dir) {
  let files = fs.readdirSync(dir).map(f => path.join(dir, f))

  let commands = files
  .filter(f => f.endsWith('.js'))
  .map(f => require(f))

  commands.push(flatten(files
    .filter(f => fs.statSync(f).isDirectory())
    .map(f => commandsInDir(f))))

  return flatten(commands)
}

module.exports = commandsInDir(__dirname)
