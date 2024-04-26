const cli = require('heroku-cli-util')
const expect = require('chai').expect

/**
 * Asserts that the given function throws an ErrorExit with the given code.
 * @param code
 * @param gen
 * @returns {*} a promise that resolves with the error thrown
 */
function assertErrorExit(code, gen) {
  return gen.catch(function (error) {
    expect(error).to.not.equal(undefined, 'Expected Error to be thrown')
    expect(error).to.be.an.instanceof(cli.exit.ErrorExit)
    expect(error.code).to.be.an('number', 'Expected error.exit(i) to be called with a number')
    expect(error.code).to.equal(code)
    return error
  })
}

module.exports = {
  assertErrorExit,
}
