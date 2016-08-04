'use strict'

const cli = require('heroku-cli-util')
const os = require('os')

function run () {
  let pjson = require('../../package.json')
  cli.log(`heroku-cli/${pjson.version} (${os.platform()}-${os.arch()}) node/${process.version}`)
}

module.exports = {
  topic: 'version',
  run
}
