'use strict'

let expect = require('chai').expect
let cli = require('heroku-cli-util')

function exit (code, gen) {
  var actual
  return gen.catch(function (err) {
    expect(err).to.be.an.instanceof(cli.exit.ErrorExit)
    actual = err.code
  }).then(function () {
    expect(actual).to.be.an('number', 'Expected error.exit(i) to be called with a number')
    expect(actual).to.equal(code)
  })
}

module.exports = exit
