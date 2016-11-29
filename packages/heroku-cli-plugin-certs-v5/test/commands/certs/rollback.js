'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../commands/certs/rollback.js')
let error = require('../../../lib/error.js')
let assertExit = require('../../assert_exit.js')

let endpoint = require('../../stubs/sni-endpoints.js').endpoint
let shared = require('./shared.js')
let sharedSsl = require('./shared_ssl.js')

describe('heroku certs:rollback', function () {
  beforeEach(function () {
    cli.mockConsole()
    error.exit.mock()
  })

  it('# requires confirmation', function () {
    let mockSsl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [endpoint])

    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])

    var thrown = false
    return certs.run({app: 'example', flags: {confirm: 'notexample'}}).catch(function (err) {
      thrown = true
      mockSsl.done()
      mockSni.done()
      expect(err).to.equal('Confirmation notexample did not match example. Aborted.')
    }).then(function () {
      expect(thrown).to.equal(true)
    })
  })

  it('# errors out for SNI endpoints', function () {
    let mockSsl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [])

    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    return assertExit(1, certs.run({app: 'example', args: {}, flags: {confirm: 'example'}})).then(function () {
      mockSsl.done()
      mockSni.done()
      expect(cli.stderr).to.equal(' ▸    SNI Endpoints cannot be rolled back, please update with a new cert.\n')
      expect(cli.stdout).to.equal('')
    })
  })

  let callback = function (path, endpoint) {
    return nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/json', 'X-Heroku-API-Version': '2'}
    })
      .post('/apps/example/ssl-endpoints/tokyo-1050.herokussl.com/rollback')
      .reply(200, endpoint)
  }

  let stderr = function () {
    return `Rolling back SSL certificate tokyo-1050 (tokyo-1050.herokussl.com) for example... done
`
  }

  let stdout = function (certificateDetails) {
    return `New active certificate details:
${certificateDetails}
`
  }

  shared.shouldHandleArgs('certs:update', 'performs a rollback on an endpoint', certs, callback, {
    stderr, stdout, flags: {confirm: 'example'}
  })

  sharedSsl.shouldHandleArgs('certs:update', 'performs a rollback on an endpoint', certs, callback, {stderr, stdout, flags: {confirm: 'example'}})
})
