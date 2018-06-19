'use strict'
/* globals describe it beforeEach afterEach cli */

let expect = require('chai').expect
let nock = require('nock')
var fs = require('fs')
var sinon = require('sinon')

let certs = require('../../../commands/certs/chain.js')
let assertExit = require('../../assert_exit.js')
let error = require('../../../lib/error.js')

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
    return assertExit(1, certs.run({app: 'example', args: []})).then(function () {
      expect(cli.stderr).to.equal(
        ` ▸    Usage: heroku certs:chain CRT [CRT ...]
 ▸    Must specify at least one certificate file.
`)
      expect(cli.stdout).to.equal('')
    })
  })

  it('# posts all certs to ssl doctor', function () {
    fs.readFile
      .withArgs('a_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem a content')
    fs.readFile
      .withArgs('b_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem b content')

    let sslDoctor = nock('https://ssl-doctor.heroku.com', {
      reqheaders: {
        'content-type': 'application/octet-stream',
        'content-length': '27'
      }
    })
      .post('/resolve-chain', 'pem a content\npem b content')
      .reply(200, 'pem a content\npem b content\n')

    return certs.run({app: 'example', args: ['a_file', 'b_file']}).then(function () {
      sslDoctor.done()
      expect(cli.stderr).to.equal('Resolving trust chain... done\n')
      expect(cli.stdout).to.equal(
        `pem a content
pem b content
`)
    })
  })
})
