'use strict'
/* globals beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../../commands/certs/index.js')

let endpointStables = require('../../../stubs/sni-endpoints.js').endpoint_stables
let endpointWildcard = require('../../../stubs/sni-endpoints.js').endpoint_wildcard
let endpointWildcardBug = require('../../../stubs/sni-endpoints.js').endpoint_wildcard_bug
let endpointAcm = require('../../../stubs/sni-endpoints.js').endpoint_acm

describe('heroku certs', function () {
  beforeEach(function () {
    cli.mockConsole()
  })

  it('warns about no SSL certificates if the app has no certs', function () {
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])

    return certs.run({app: 'example'}).then(function () {
      mockSni.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal('example has no SSL certificates.\nUse heroku certs:add CRT KEY to add one.\n')
    })
  })

  it('# shows ACM for the type when acm true', function () {
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointAcm])

    return certs.run({app: 'example'}).then(function () {
      mockSni.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `Name        Common Name(s)  Expires               Trusted  Type
──────────  ──────────────  ────────────────────  ───────  ────
tokyo-1050  heroku.com      2013-08-01 21:34 UTC  True     ACM
`)
      /* eslint-enable no-trailing-spaces */
    })
  })

  it('# shows certs with common names stacked and stable matches', function () {
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointStables])

    return certs.run({app: 'example'}).then(function () {
      mockSni.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `Name        Common Name(s)                                     Expires               Trusted  Type  Domains
──────────  ─────────────────────────────────────────────────  ────────────────────  ───────  ────  ───────
tokyo-1050  foo.example.org, bar.example.org, biz.example.com  2013-08-01 21:34 UTC  False    SNI   0
`)
      /* eslint-enable no-trailing-spaces */
    })
  })

  it('# shows certs with common names stacked and stable matches (bugfix)', function () {
    let mockSni = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointWildcardBug])

    return certs.run({app: 'example'}).then(function () {
      mockSni.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `Name        Common Name(s)  Expires               Trusted  Type  Domains
──────────  ──────────────  ────────────────────  ───────  ────  ───────
tokyo-1050  fooexample.org  2013-08-01 21:34 UTC  False    SNI   0
`)
      /* eslint-enable no-trailing-spaces */
    })
  })

  it('# shows certs with common names stacked and stable matches wildcard', function () {
    let mockSni = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointWildcard])

    return certs.run({app: 'example'}).then(function () {
      mockSni.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `Name        Common Name(s)  Expires               Trusted  Type  Domains
──────────  ──────────────  ────────────────────  ───────  ────  ───────
tokyo-1050  *.example.org   2013-08-01 21:34 UTC  False    SNI   0
`)
      /* eslint-enable no-trailing-spaces */
    })
  })

  it('# shows certs with common names stacked and just stable cname matches', function () {
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointStables])

    return certs.run({app: 'example'}).then(function () {
      mockSni.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `Name        Common Name(s)                                     Expires               Trusted  Type  Domains
──────────  ─────────────────────────────────────────────────  ────────────────────  ───────  ────  ───────
tokyo-1050  foo.example.org, bar.example.org, biz.example.com  2013-08-01 21:34 UTC  False    SNI   0
`)
      /* eslint-enable no-trailing-spaces */
    })
  })
})
