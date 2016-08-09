'use strict'

const co = require('co')
const plugins = require('../plugins')

function * run () {
  yield plugins.update()
}

module.exports = {
  topic: 'update',
  description: 'update the CLI and plugins',
  run: co.wrap(run)
}
