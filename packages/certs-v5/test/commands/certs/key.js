'use strict'
/* globals describe it beforeEach afterEach cli */

let expect = require('chai').expect
let nock = require('nock')
var fs = require('fs')
var sinon = require('sinon')

let certs = require('../../../commands/certs/key.js')
let assertExit = require('../../assert_exit.js')
let error = require('../../../lib/error.js')
const unwrap = require('../../unwrap')

describe('heroku certs:key', function () {
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
    return assertExit(1, certs.run({ app: 'example', args: ['foo'] })).then(function () {
      expect(unwrap(cli.stderr)).to.equal(
        'Usage: heroku certs:key CRT KEY [KEY ...] Must specify one certificate file and at least one key file.\n')
      expect(cli.stdout).to.equal('')
    })
  })
})
