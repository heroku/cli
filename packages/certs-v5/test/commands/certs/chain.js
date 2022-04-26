'use strict'
/* globals describe it beforeEach afterEach cli */

let expect = require('chai').expect
let nock = require('nock')
var fs = require('fs')
var sinon = require('sinon')

let certs = require('../../../commands/certs/chain.js')
let assertExit = require('../../assert_exit.js')
let error = require('../../../lib/error.js')
const unwrap = require('../../unwrap')

describe('heroku certs:chain', function () {
  beforeEach(function () {
    cli.mockConsole()
    error.exit.mock()

    sinon.stub(fs, 'readFile')
    fs.readFile.throws('unstubbed')

    nock.cleanAll()
  })

  afterEach(function () {
    fs.readFile.restore()
  })

  it('# validates that at least one argument is passed', function () {
    return assertExit(1, certs.run({ app: 'example', args: [] })).then(function () {
      expect(unwrap(cli.stderr)).to.equal(
        'Usage: heroku certs:chain CRT [CRT ...] Must specify at least one certificate file.\n')
      expect(cli.stdout).to.equal('')
    })
  })
})
