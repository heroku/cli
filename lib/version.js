'use strict'

const fs = require('fs')
const path = require('path')
let version
try {
  version = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf-8').trim()
} catch (err) {
  version = 'dev'
}

module.exports = `heroku-cli/${version} (${process.platform}-${process.arch}) node-${process.version}`
