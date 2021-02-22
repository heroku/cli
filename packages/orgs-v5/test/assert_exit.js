'use strict'

let expect = require('chai').expect
let ErrorExit = require('../lib/error.js').ErrorExit

async function assertErrorExit(code, gen) {
  var actual

  await gen.catch(function (err) {
    expect(err).to.be.an.instanceof(ErrorExit)
    actual = err.code
  })

  expect(actual).to.be.an('number', 'Expected error.exit(i) to be called with a number')
  expect(actual).to.equal(code)
}

module.exports = assertErrorExit
