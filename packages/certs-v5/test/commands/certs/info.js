'use strict'
/* globals describe it beforeEach cli */

let certs = require('../../../commands/certs/info.js')
let nock = require('nock')
let expect = require('chai').expect

let shared = require('./shared.js')
let sharedSni = require('./shared_sni.js')
let sharedSsl = require('./shared_ssl.js')
let endpoint = require('../../stubs/sni-endpoints.js').endpoint
let endpointUntrusted = require('../../stubs/sni-endpoints.js').endpoint_untrusted
let endpointTrusted = require('../../stubs/sni-endpoints.js').endpoint_trusted
let certificateDetails = require('../../stubs/sni-endpoints.js').certificate_details
const mockSniFeatureFlag = require('../../lib/mock_sni_feature')

describe('heroku certs:info ported', function () {
  beforeEach(function () {
    mockSniFeatureFlag(nock, 'example')
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
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.ssl_cert' }
    })
      .get('/apps/example/ssl-endpoints/tokyo-1050')
      .reply(200, endpoint)

    return certs.run({ app: 'example', args: {}, flags: {} }).then(function () {
      mockSsl.done()
      mockSni.done()
      mock.done()
      expect(cli.stderr).to.equal('Fetching SSL certificate tokyo-1050 info for example... done\n')
      expect(cli.stdout).to.equal(`Certificate details:
${certificateDetails}
`)
    })
  })

  it('shows certificate details when not trusted', function () {
    let mockSsl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [endpoint])

    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])

    let mock = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.ssl_cert' }
    })
      .get('/apps/example/ssl-endpoints/tokyo-1050')
      .reply(200, endpointUntrusted)

    return certs.run({ app: 'example', args: {}, flags: {} }).then(function () {
      mockSsl.done()
      mockSni.done()
      mock.done()
      expect(cli.stderr).to.equal('Fetching SSL certificate tokyo-1050 info for example... done\n')
      expect(cli.stdout).to.equal(`Certificate details:
Common Name(s): example.org
Expires At:     2013-08-01 21:34 UTC
Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
Starts At:      2012-08-01 21:34 UTC
Subject:        /C=US/ST=California/L=San Francisco/O=Untrusted/CN=untrusted.example.org
SSL certificate is not trusted.
`)
    })
  })

  it('shows certificate details when trusted', function () {
    let mockSsl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [endpoint])

    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])

    let mock = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.ssl_cert' }
    })
      .get('/apps/example/ssl-endpoints/tokyo-1050')
      .reply(200, endpointTrusted)

    return certs.run({ app: 'example', args: {}, flags: {} }).then(function () {
      mockSsl.done()
      mockSni.done()
      mock.done()
      expect(cli.stderr).to.equal('Fetching SSL certificate tokyo-1050 info for example... done\n')
      expect(cli.stdout).to.equal(`Certificate details:
Common Name(s): example.org
Expires At:     2013-08-01 21:34 UTC
Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
Starts At:      2012-08-01 21:34 UTC
Subject:        /C=US/ST=California/L=San Francisco/O=Trusted/CN=trusted.example.org
SSL certificate is verified by a root authority.
`)
    })
  })
})

describe('heroku', function () {
  let callback = function (err, path, endpoint, variant) {
    if (err) throw err
    return nock('https://api.heroku.com', {
      reqheaders: { 'Accept': `application/vnd.heroku+json; version=3.${variant}` }
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

  shared.shouldHandleArgs('certs:info', 'shows certificate details', certs, callback, { stderr, stdout })

  sharedSni.shouldHandleArgs('certs:info', 'shows certificate details', certs, callback, { stderr, stdout })

  sharedSsl.shouldHandleArgs('certs:info', 'shows certificate details', certs, callback, { stderr, stdout })
})
