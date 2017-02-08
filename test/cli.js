const {describe, it, beforeEach, afterEach} = require('mocha')

describe('cli', () => {
  beforeEach(function () {
    this.log = console.log
    this.argv = process.argv
    this.exit = process.exit
  })

  afterEach(function () {
    console.log = this.log
    process.exit = this.exit
    process.argv = this.argv
  })

  it('runs the version command', async function () {
    this.output = ''
    console.log = output => { this.output += output + '\n' }
    process.exit = code => { this.code = code }
    process.argv = ['node', 'heroku', 'version']
    await require('../cli')
    this.output.should.match(/^heroku-cli/)
    this.code.should.eq(0)
  })
})
