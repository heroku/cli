const cli = require('heroku-cli-util')
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
