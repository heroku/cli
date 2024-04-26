const cli = require('heroku-cli-util')
const expect = require('chai').expect

/**
 * Asserts that the given function throws an ErrorExit with the given code.
 * @param code
 * @param gen
 * @returns {*} a promise that resolves with the error thrown
 */
function assertErrorExit(code, gen) {
  let actualError
  return gen.catch(function (error) {
    actualError = error
  }).then(function () {
    expect(actualError).to.not.equal(undefined, 'Expected Error to be thrown')
    expect(actualError).to.be.an.instanceof(cli.exit.ErrorExit)
    expect(actualError.code).to.be.an('number', 'Expected error.exit(i) to be called with a number')
    expect(actualError.code).to.equal(code)
    return actualError
  })
}

module.exports = {
  assertErrorExit,
}
