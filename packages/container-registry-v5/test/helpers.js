'use strict'

const cli = require('heroku-cli-util')
cli.raiseErrors = true // Fully raise exceptions
global.commands = require('../index').commands // Load plugin commands
process.env.TZ = 'UTC' // Use UTC time always
require('mockdate').set(new Date()) // Freeze time
process.stdout.columns = 80 // Set screen width for consistent wrapping
process.stderr.columns = 80 // Set screen width for consistent wrapping

const nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}

const chai = require('chai')
chai.use(require('chai-as-promised'))

const expect = require('chai').expect

function assertExit(code, gen) {
  let actualError
  return gen.catch(function (error) {
    expect(error).to.be.an.instanceof(cli.exit.ErrorExit)
    actualError = error
  }).then(function () {
    expect(actualError).to.not.equal(undefined, 'Expected Error to be thrown')
    expect(actualError.code).to.be.an('number', 'Expected error.exit(i) to be called with a number')
    expect(actualError.code).to.equal(code)
    return actualError
  })
}

module.exports = {
  assertExit,
}
