'use strict'

var util = require('util')
var cli = require('heroku-cli-util')

function ErrorExit(code) {
  Error.call(this)
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name

  this.code = code
}

util.inherits(ErrorExit, Error)

var mocking

function exit(code, message) {
  if (message) {
    cli.error(message)
  }

  if (mocking) {
    throw new ErrorExit(code)
  } else {
    process.exit(code)
  }
}

exit.mock = function () {
  mocking = true
}

module.exports = {
  exit,
  ErrorExit,
}
