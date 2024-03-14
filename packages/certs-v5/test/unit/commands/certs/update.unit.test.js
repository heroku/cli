'use strict'
/* globals beforeEach afterEach cli */

let expect = require('chai').expect
let nock = require('nock')
var fs = require('fs')
var sinon = require('sinon')

let certs = require('../../../../commands/certs/update.js')
let error = require('../../../../lib/error.js')
let assertExit = require('../../../assert_exit.js')
let sharedSni = require('./shared_sni.unit.test.js')

let endpointStable = require('../../../stubs/sni-endpoints.js').endpoint_stable
let endpointWarning = require('../../../stubs/sni-endpoints.js').endpoint_warning
let certificateDetails = require('../../../stubs/sni-endpoints.js').certificate_details
let unwrap = require('../../../unwrap.js')

function mockFile(fs, file, content) {
  fs.readFile
    .withArgs(file, 'utf-8', sinon.match.func)
    .callsArgWithAsync(2, null, content)
}

describe('heroku certs:update', function () {
  beforeEach(function () {
    cli.mockConsole()
    sinon.stub(fs, 'readFile')
    nock.cleanAll()
    error.exit.mock()

    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointStable])
  })

  afterEach(function () {
    fs.readFile.restore()
  })

  it('# requires confirmation', function () {
    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    var thrown = false
    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {confirm: 'notexample'}}).catch(function (error_) {
      thrown = true
      expect(error_.message).to.equal('Confirmation notexample did not match example. Aborted.')
    }).then(function () {
      expect(thrown).to.equal(true)
    })
  })

  it('# errors out when args < 2', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})

    return assertExit(1, certs.run({app: 'example', args: ['pem_file'], flags: {}})).then(function () {
      expect(unwrap(cli.stderr)).to.equal('Usage: heroku certs:add CRT KEY\n')
      expect(cli.stdout).to.equal('')
    })
  })

  it('# can run', function () {
    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let mock = nock('https://api.heroku.com')
      .patch('/apps/example/sni-endpoints/tokyo-1050', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpointStable)

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {confirm: 'example'}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Updating SSL certificate tokyo-1050 for example... done\n')
      expect(cli.stdout).to.equal(
        `Updated certificate details:
${certificateDetails}
`)
    })
  })

  it('# errors out with intermediaries', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})

    return assertExit(1, certs.run({app: 'example', args: ['pem_file', 'int_file', 'key_file'], flags: {}})).then(function () {
      expect(unwrap(cli.stderr)).to.equal('Usage: heroku certs:add CRT KEY\n')
      expect(cli.stdout).to.equal('')
    })
  })

  it('# displays warnings', function () {
    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let mock = nock('https://api.heroku.com')
      .patch('/apps/example/sni-endpoints/tokyo-1050', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpointWarning)

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {confirm: 'example'}}).then(function () {
      mock.done()
      expect(unwrap(cli.stderr)).to.equal('Updating SSL certificate tokyo-1050 for example... done WARNING: ssl_cert provides no domain(s) that are configured for this Heroku app\n')
    })
  })

  describe('shared', function () {
    beforeEach(function () {
      mockFile(fs, 'pem_file', 'pem content')
      mockFile(fs, 'key_file', 'key content')
    })

    let callback = function (err, path, endpoint, variant) {
      if (err) throw err
      return nock('https://api.heroku.com', {
        reqheaders: {Accept: `application/vnd.heroku+json; version=3.${variant}`},
      })
        .patch(path, {
          certificate_chain: 'pem content', private_key: 'key content',
        })
        .reply(200, endpoint)
    }

    let stderr = function (endpoint) {
      return `Updating SSL certificate ${endpoint.name} (${endpoint.cname}) for example... done
`
    }

    let stdout = function (certificateDetails) {
      return `Updated certificate details:
${certificateDetails}
`
    }

    sharedSni.shouldHandleArgs('certs:update', 'updates an endpoint', certs, callback, {
      stderr, stdout, args: ['pem_file', 'key_file'], flags: {confirm: 'example'},
    })
  })
})
