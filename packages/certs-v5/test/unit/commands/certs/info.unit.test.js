'use strict'
/* globals beforeEach cli */

let certs = require('../../../../commands/certs/info.js')
let nock = require('nock')
let expect = require('chai').expect

let sharedSni = require('./shared_sni.unit.test.js')
let endpoint = require('../../../stubs/sni-endpoints.js').endpoint
let endpointWithDomains = require('../../../stubs/sni-endpoints.js').endpoint_with_domains
let endpointUntrusted = require('../../../stubs/sni-endpoints.js').endpoint_untrusted
let endpointTrusted = require('../../../stubs/sni-endpoints.js').endpoint_trusted
let certificateDetails = require('../../../stubs/sni-endpoints.js').certificate_details

describe('heroku certs:info', function () {
  beforeEach(function () {
    cli.mockConsole()
  })

  it('shows certificate details when self-signed', function () {
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    let mock = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
    })
      .get('/apps/example/sni-endpoints/tokyo-1050')
      .reply(200, endpoint)

    return certs.run({app: 'example', args: {}, flags: {}}).then(function () {
      mockSni.done()
      mock.done()
      expect(cli.stderr).to.equal('Fetching SSL certificate tokyo-1050 info for example... done\n')
      expect(cli.stdout).to.equal(`Certificate details:
${certificateDetails}
`)
    })
  })

  it('returns domains when show-domains flag is passed', function () {
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointWithDomains])

    let mock = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
    })
      .get('/apps/example/sni-endpoints/tokyo-1050')
      .reply(200, endpointWithDomains)

    let mockDomains = nock('https://api.heroku.com')
      .get('/apps/example/domains/example.heroku.com')
      .reply(200, [endpointWithDomains])

    return certs.run({app: 'example', args: {}, flags: {'show-domains': true}}).then(function () {
      mockSni.done()
      mock.done()
      mockDomains.done()
      expect(mockDomains.isDone()).to.equal(true)
    })
  })

  it('shows certificate details when not trusted', function () {
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    let mock = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
    })
      .get('/apps/example/sni-endpoints/tokyo-1050')
      .reply(200, endpointUntrusted)

    return certs.run({app: 'example', args: {}, flags: {}}).then(function () {
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
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    let mock = nock('https://api.heroku.com', {
      reqheaders: {
        Accept: 'application/vnd.heroku+json; version=3',
      },
    })
      .get('/apps/example/sni-endpoints/tokyo-1050')
      .reply(200, endpointTrusted)

    return certs.run({app: 'example', args: {}, flags: {}}).then(function () {
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

describe('heroku shared', function () {
  let callback = function (err, path, endpoint) {
    if (err) throw err
    return nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
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

  sharedSni.shouldHandleArgs('certs:info', 'shows certificate details', certs, callback, {stderr, stdout})
})
