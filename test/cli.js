const {describe, it, beforeEach, afterEach} = require('mocha')

describe('cli', () => {
  beforeEach(function () {
    this.exit = process.exit
    process.exit = code => { this.code = code }
  })

  afterEach(function () {
    process.exit = this.exit
    delete this.code
  })

  it('runs the version command', async function () {
    await require('../cli')('version')
    this.code.should.eq(0)
  })
})
