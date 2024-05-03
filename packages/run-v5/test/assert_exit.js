'use strict'

let expect = require('chai').expect
let cli = require('@heroku/heroku-cli-util')

function exit(code, gen) {
  var actual
  return gen.catch(function (error) {
    expect(error).to.be.an.instanceof(cli.exit.ErrorExit)
    actual = error.code
  }).then(function () {
    expect(actual).to.be.an('number', 'Expected error.exit(i) to be called with a number')
    expect(actual).to.equal(code)
  })
}

module.exports = exit
