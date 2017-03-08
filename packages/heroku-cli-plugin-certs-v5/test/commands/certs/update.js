'use strict'
/* globals describe it beforeEach afterEach cli */

let expect = require('chai').expect
let nock = require('nock')
var fs = require('fs')
var sinon = require('sinon')

let certs = require('../../../commands/certs/update.js')
let error = require('../../../lib/error.js')
let assertExit = require('../../assert_exit.js')
let shared = require('./shared.js')
let sharedSsl = require('./shared_ssl.js')
let sharedSni = require('./shared_sni.js')

let endpoint = require('../../stubs/sni-endpoints.js').endpoint
let endpointStable = require('../../stubs/sni-endpoints.js').endpoint_stable
let endpointWarning = require('../../stubs/sni-endpoints.js').endpoint_warning
let certificateDetails = require('../../stubs/sni-endpoints.js').certificate_details
let unwrap = require('../../unwrap.js')

function mockFile (fs, file, content) {
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
      .get('/apps/example/ssl-endpoints')
      .reply(200, [])

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
    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {confirm: 'notexample', bypass: true}}).catch(function (err) {
      thrown = true
      expect(err).to.equal('Confirmation notexample did not match example. Aborted.')
    }).then(function () {
      expect(thrown).to.equal(true)
    })
  })

  it('# updates an endpoint when ssl doctor passes', function () {
    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let sslDoctor = nock('https://ssl-doctor.heroku.com', {
      reqheaders: {
        'content-type': 'application/octet-stream',
        'content-length': '23'
      }
    })
      .post('/resolve-chain-and-key', 'pem content\nkey content')
      .reply(200, {pem: 'pem content', key: 'key content'})

    let mock = nock('https://api.heroku.com')
      .patch('/apps/example/sni-endpoints/tokyo-1050', {
        certificate_chain: 'pem content', private_key: 'key content'
      })
      .reply(200, endpointStable)

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {name: 'tokyo-1050', confirm: 'example'}}).then(function () {
      sslDoctor.done()
      mock.done()
      expect(cli.stderr).to.equal('Resolving trust chain... done\nUpdating SSL certificate tokyo-1050 for example... done\n')
      expect(cli.stdout).to.equal(
        `Updated certificate details:
${certificateDetails}
`)
    })
  })

  it('# posts intermediaries to ssl doctor', function () {
    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'int_file', 'int content')
    mockFile(fs, 'key_file', 'key content')

    let sslDoctor = nock('https://ssl-doctor.heroku.com', {
      reqheaders: {
        'content-type': 'application/octet-stream',
        'content-length': '35'
      }
    })
      .post('/resolve-chain-and-key', 'pem content\nint content\nkey content')
      .reply(200, {pem: 'pem content\nint content', key: 'key content'})

    let mock = nock('https://api.heroku.com')
      .patch('/apps/example/sni-endpoints/tokyo-1050', {
        certificate_chain: 'pem content\nint content', private_key: 'key content'
      })
      .reply(200, endpoint)

    return certs.run({app: 'example', args: ['pem_file', 'int_file', 'key_file'], flags: {confirm: 'example'}}).then(function () {
      sslDoctor.done()
      mock.done()
      expect(cli.stderr).to.equal('Resolving trust chain... done\nUpdating SSL certificate tokyo-1050 for example... done\n')
      expect(cli.stdout).to.equal(
        `Updated certificate details:
${certificateDetails}
`)
    })
      /* eslint-enable no-irregular-whitespace */
  })

  it('# errors out when args < 2', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, { 'space': null })

    return assertExit(1, certs.run({app: 'example', args: ['pem_file'], flags: {}})).then(function () {
      expect(cli.stderr).to.equal(' ▸    Usage: heroku certs:add CRT KEY\n')
      expect(cli.stdout).to.equal('')
    })
  })

  it('# propegates ssl doctor errors', function () {
    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let sslDoctor = nock('https://ssl-doctor.heroku.com', {
      reqheaders: {
        'content-type': 'application/octet-stream',
        'content-length': '23'
      }
    })
      .post('/resolve-chain-and-key', 'pem content\nkey content')
      .reply(422, 'No certificate given is a domain name certificate.')

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {confirm: 'example'}})
      .then(function () {
        expect.fail('Expected exception')
      })
      .catch(function (err) {
        sslDoctor.done()
        expect(cli.stdout).to.equal('')
        expect(cli.stderr).to.equal('Resolving trust chain... !\n')
        expect(err.message).to.equal('No certificate given is a domain name certificate.')
      })
  })

  it('# bypasses ssl doctor', function () {
    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let mock = nock('https://api.heroku.com')
      .patch('/apps/example/sni-endpoints/tokyo-1050', {
        certificate_chain: 'pem content', private_key: 'key content'
      })
      .reply(200, endpointStable)

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {bypass: true, confirm: 'example'}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Updating SSL certificate tokyo-1050 for example... done\n')
      expect(cli.stdout).to.equal(
        `Updated certificate details:
${certificateDetails}
`)
    })
  })

  it('# bypass errors out with intermediaries', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, { 'space': null })

    return assertExit(1, certs.run({app: 'example', args: ['pem_file', 'int_file', 'key_file'], flags: {bypass: true}})).then(function () {
      expect(cli.stderr).to.equal(' ▸    Usage: heroku certs:add CRT KEY\n')
      expect(cli.stdout).to.equal('')
    })
  })

  it('# displays warnings', function () {
    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let mock = nock('https://api.heroku.com')
      .patch('/apps/example/sni-endpoints/tokyo-1050', {
        certificate_chain: 'pem content', private_key: 'key content'
      })
      .reply(200, endpointWarning)

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {bypass: true, confirm: 'example'}}).then(function () {
      mock.done()
      expect(unwrap(cli.stderr)).to.equal('Updating SSL certificate tokyo-1050 for example... done WARNING: ssl_cert provides no domain(s) that are configured for this Heroku app\n')
    })
  })

  describe('shared', function () {
    beforeEach(function () {
      mockFile(fs, 'pem_file', 'pem content')
      mockFile(fs, 'key_file', 'key content')
    })

    let callback = function (path, endpoint, variant) {
      return nock('https://api.heroku.com', {
        reqheaders: {'Accept': `application/vnd.heroku+json; version=3.${variant}`}
      })
        .patch(path, {
          certificate_chain: 'pem content', private_key: 'key content'
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

    shared.shouldHandleArgs('certs:update', 'updates an endpoint', certs, callback, {
      stderr, stdout, args: ['pem_file', 'key_file'], flags: {bypass: true, confirm: 'example'}
    })

    sharedSsl.shouldHandleArgs('certs:update', 'updates an endpoint', certs, callback, {
      stderr, stdout, args: ['pem_file', 'key_file'], flags: {bypass: true, confirm: 'example'}
    })

    sharedSni.shouldHandleArgs('certs:update', 'updates an endpoint', certs, callback, {
      stderr, stdout, args: ['pem_file', 'key_file'], flags: {bypass: true, confirm: 'example'}
    })
  })
})

describe('heroku certs:update (dogwood)', function () {
  beforeEach(function () {
    cli.mockConsole()
    sinon.stub(fs, 'readFile')
    nock.cleanAll()
  })

  afterEach(function () {
    fs.readFile.restore()
  })

  it('# updates an endpoint when sni-endpoints 422s', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {
        'space': {'name': 'spacely-space-1234'}
      })

    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(422, {
        'id': 'space_app_not_supported',
        'message': 'App heroku-certs-test is in a space, but space apps are not supported on this endpoint. Try `/apps/:id/ssl-endpoints` instead.'
      })

    nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [endpointStable])

    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let mockPut = nock('https://api.heroku.com')
      .patch('/apps/example/ssl-endpoints/tokyo-1050', {
        certificate_chain: 'pem content', private_key: 'key content'
      })
      .reply(200, endpointStable)

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {name: 'tokyo-1050', confirm: 'example', bypass: true}}).then(function () {
      mockSni.done()
      mockPut.done()
      expect(cli.stderr).to.equal('Updating SSL certificate tokyo-1050 for example... done\n')
      expect(cli.stdout).to.equal(
        `Updated certificate details:
${certificateDetails}
`)
    })
  })
})
