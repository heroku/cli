'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../commands/certs/index.js')

let endpoint = require('../../stubs/sni-endpoints.js').endpoint
let endpoint2 = require('../../stubs/sni-endpoints.js').endpoint2
let endpointStables = require('../../stubs/sni-endpoints.js').endpoint_stables
let endpointWildcard = require('../../stubs/sni-endpoints.js').endpoint_wildcard
let endpointWildcardBug = require('../../stubs/sni-endpoints.js').endpoint_wildcard_bug
let endpointAcm = require('../../stubs/sni-endpoints.js').endpoint_acm

let endpointSpace = require('../../stubs/ssl-endpoints.js').endpoint_space

describe('heroku certs', function () {
  beforeEach(function () {
    cli.mockConsole()
  })

  describe('(ported)', function () {
    it('# shows a list of certs', function () {
      let mockSni = nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [])

      let mockSsl = nock('https://api.heroku.com')
        .get('/apps/example/ssl-endpoints')
        .reply(200, [endpoint, endpoint2])

      return certs.run({ app: 'example' }).then(function () {
        mockSni.done()
        mockSsl.done()
        expect(cli.stderr).to.equal('')
        /* eslint-disable no-trailing-spaces */
        expect(cli.stdout).to.equal(
          `Name        Endpoint                  Common Name(s)  Expires               Trusted  Type
──────────  ────────────────────────  ──────────────  ────────────────────  ───────  ────────
akita-7777  akita-7777.herokussl.com  heroku.com      2013-08-01 21:34 UTC  True     Endpoint
tokyo-1050  tokyo-1050.herokussl.com  example.org     2013-08-01 21:34 UTC  False    Endpoint
`)
        /* eslint-enable no-trailing-spaces */
      })
    })

    it('warns about no SSL certificates if the app has no certs', function () {
      let mockSni = nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [])

      let mockSsl = nock('https://api.heroku.com')
        .get('/apps/example/ssl-endpoints')
        .reply(200, [])

      return certs.run({ app: 'example' }).then(function () {
        mockSni.done()
        mockSsl.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`example has no SSL certificates.\nUse heroku certs:add CRT KEY to add one.\n`)
      })
    })
  })

  it('# shows a mix of certs ordered by name', function () {
    let mockSni = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert' }
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointStables])

    let mockSsl = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.ssl_cert' }
    })
      .get('/apps/example/ssl-endpoints')
      .reply(200, [endpoint2])

    return certs.run({ app: 'example' }).then(function () {
      mockSni.done()
      mockSsl.done()
      expect(cli.stderr).to.equal('')
      /* eslint-disable no-trailing-spaces */
      expect(cli.stdout).to.equal(
        `Name        Endpoint                  Common Name(s)                                     Expires               Trusted  Type
──────────  ────────────────────────  ─────────────────────────────────────────────────  ────────────────────  ───────  ────────
akita-7777  akita-7777.herokussl.com  heroku.com                                         2013-08-01 21:34 UTC  True     Endpoint
tokyo-1050  (Not applicable for SNI)  foo.example.org, bar.example.org, biz.example.com  2013-08-01 21:34 UTC  False    SNI
`)
      /* eslint-enable no-trailing-spaces */
    })
  })

  it('# shows Private Space App for the type when in private space', function () {
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(422, {
        'id': 'space_app_not_supported',
        'message': 'App heroku-certs-test is in a space, but space apps are not supported on this endpoint. Try `/apps/:id/ssl-endpoints` instead.'
      })

    let mockSsl = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.ssl_cert' }
    })
      .get('/apps/example/ssl-endpoints')
      .reply(200, [endpointSpace])

    return certs.run({ app: 'example' }).then(function () {
      mockSni.done()
      mockSsl.done()
      expect(cli.stderr).to.equal('')
      /* eslint-disable no-trailing-spaces */
      expect(cli.stdout).to.equal(
        `Name        Endpoint                               Common Name(s)  Expires               Trusted  Type
──────────  ─────────────────────────────────────  ──────────────  ────────────────────  ───────  ─────────────────
tokyo-1050  tokyo-1050.japan-4321.herokuspace.com  heroku.com      2013-08-01 21:34 UTC  True     Private Space App
`)
      /* eslint-enable no-trailing-spaces */
    })
  })

  it('# shows ACM for the type when acm true', function () {
    let mockSni = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert' }
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointAcm])

    let mockSsl = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.ssl_cert' }
    })
      .get('/apps/example/ssl-endpoints')
      .reply(200, [])

    return certs.run({ app: 'example' }).then(function () {
      mockSni.done()
      mockSsl.done()
      expect(cli.stderr).to.equal('')
      /* eslint-disable no-trailing-spaces */
      expect(cli.stdout).to.equal(
        `Name        Common Name(s)  Expires               Trusted  Type
──────────  ──────────────  ────────────────────  ───────  ────
tokyo-1050  heroku.com      2013-08-01 21:34 UTC  True     ACM
`)
      /* eslint-enable no-trailing-spaces */
    })
  })

  it('# shows certs with common names stacked and stable matches', function () {
    let mockSni = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert' }
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointStables])

    let mockSsl = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.ssl_cert' }
    })
      .get('/apps/example/ssl-endpoints')
      .reply(200, [])

    return certs.run({ app: 'example' }).then(function () {
      mockSni.done()
      mockSsl.done()
      expect(cli.stderr).to.equal('')
      /* eslint-disable no-trailing-spaces */
      expect(cli.stdout).to.equal(
        `Name        Common Name(s)                                     Expires               Trusted  Type
──────────  ─────────────────────────────────────────────────  ────────────────────  ───────  ────
tokyo-1050  foo.example.org, bar.example.org, biz.example.com  2013-08-01 21:34 UTC  False    SNI
`)
      /* eslint-enable no-trailing-spaces */
    })
  })

  it('# shows certs with common names stacked and stable matches (bugfix)', function () {
    let mockSni = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert' }
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointWildcardBug])

    let mockSsl = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.ssl_cert' }
    })
      .get('/apps/example/ssl-endpoints')
      .reply(200, [])

    return certs.run({ app: 'example' }).then(function () {
      mockSni.done()
      mockSsl.done()
      expect(cli.stderr).to.equal('')
      /* eslint-disable no-trailing-spaces */
      expect(cli.stdout).to.equal(
        `Name        Common Name(s)  Expires               Trusted  Type
──────────  ──────────────  ────────────────────  ───────  ────
tokyo-1050  fooexample.org  2013-08-01 21:34 UTC  False    SNI
`)
      /* eslint-enable no-trailing-spaces */
    })
  })

  it('# shows certs with common names stacked and stable matches wildcard', function () {
    let mockSni = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert' }
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointWildcard])

    let mockSsl = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.ssl_cert' }
    })
      .get('/apps/example/ssl-endpoints')
      .reply(200, [])

    return certs.run({ app: 'example' }).then(function () {
      mockSni.done()
      mockSsl.done()
      expect(cli.stderr).to.equal('')
      /* eslint-disable no-trailing-spaces */
      expect(cli.stdout).to.equal(
        `Name        Common Name(s)  Expires               Trusted  Type
──────────  ──────────────  ────────────────────  ───────  ────
tokyo-1050  *.example.org   2013-08-01 21:34 UTC  False    SNI
`)
      /* eslint-enable no-trailing-spaces */
    })
  })

  it('# shows certs with common names stacked and just stable cname matches', function () {
    let mockSni = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert' }
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointStables])

    let mockSsl = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.ssl_cert' }
    })
      .get('/apps/example/ssl-endpoints')
      .reply(200, [])

    return certs.run({ app: 'example' }).then(function () {
      mockSni.done()
      mockSsl.done()
      expect(cli.stderr).to.equal('')
      /* eslint-disable no-trailing-spaces */
      expect(cli.stdout).to.equal(
        `Name        Common Name(s)                                     Expires               Trusted  Type
──────────  ─────────────────────────────────────────────────  ────────────────────  ───────  ────
tokyo-1050  foo.example.org, bar.example.org, biz.example.com  2013-08-01 21:34 UTC  False    SNI
`)
      /* eslint-enable no-trailing-spaces */
    })
  })

  it('# traps the "id":"space_app_not_supported" error in dogwood', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {
        'space': { 'name': 'spacely-space-1234' }
      })

    nock('https://api.heroku.com')
      .get('/apps/example/addons/ssl%3Aendpoint')
      .reply(404, {
        'id': 'not_found',
        'resource': 'addon'
      })

    nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [])

    nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [])

    let mock = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(422, {
        'id': 'space_app_not_supported',
        'message': 'App heroku-certs-test is in a space, but space apps are not supported on this endpoint. Try `/apps/:id/ssl-endpoints` instead.'
      })

    return certs.run({ app: 'example', args: {}, flags: {} }).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(`example has no SSL certificates.\nUse heroku certs:add CRT KEY to add one.\n`)
    })
  })
})
