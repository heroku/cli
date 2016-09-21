'use strict'
/* globals describe it beforeEach cli */

let certs = require('../../../commands/certs/info.js')[0]
let nock = require('nock')
let expect = require('chai').expect

let shared = require('./shared.js')
let sharedSni = require('./shared_sni.js')
let sharedSsl = require('./shared_ssl.js')
let endpoint = require('../../stubs/sni-endpoints.js').endpoint
let certificateDetails = require('../../stubs/sni-endpoints.js').certificate_details

describe('heroku certs:info ported', function () {
  beforeEach(function () {
    cli.mockConsole()
  })

  it('shows certificate details', function () {
    let mockSsl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [endpoint])

    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])

    let mock = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.ssl_cert'}
    })
      .get('/apps/example/ssl-endpoints/tokyo-1050')
      .reply(200, endpoint)

    return certs.run({app: 'example', args: {}, flags: {}}).then(function () {
      mockSsl.done()
      mockSni.done()
      mock.done()
      expect(cli.stderr).to.equal('Fetching SSL certificate tokyo-1050 info for example... done\n')
      expect(cli.stdout).to.equal(`Certificate details:
${certificateDetails}
`)
    })
  })
})

describe('heroku', function () {
  let callback = function (path, endpoint, variant) {
    return nock('https://api.heroku.com', {
      reqheaders: {'Accept': `application/vnd.heroku+json; version=3.${variant}`}
    })
      .get(path)
      .reply(200, endpoint)
  }

  let stderr = function (endpoint) {
    return `Fetching SSL certificate ${endpoint.name} info for example... done
`
  }

  let stdout = function (certificateDetails) {
    return `Certificate details:
${certificateDetails}
`
  }

  shared.shouldHandleArgs('certs:info', 'shows certificate details', certs, callback, {stderr, stdout})

  sharedSni.shouldHandleArgs('certs:info', 'shows certificate details', certs, callback, {stderr, stdout})

  sharedSsl.shouldHandleArgs('certs:info', 'shows certificate details', certs, callback, {stderr, stdout})
})
