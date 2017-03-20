'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../../commands/certs/auto/enable.js')

describe('heroku certs:auto:enable', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('enables acm with domains', function () {
    let acmApi = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.cedar-acm'}
    })
    acmApi.post('/apps/example/acm', {}).reply(200, {acm: true})

    let domainsApi = nock('https://api.heroku.com')
    domainsApi.get('/apps/example/domains').reply(200, [
      {'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null},
      {'kind': 'custom', 'hostname': 'foo.example.org', 'cname': 'foo.example.org.herokudns.com'}
    ])

    domainsApi.get('/apps/example/domains').reply(200, [
      {'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null},
      {'kind': 'custom', 'hostname': 'foo.example.org', 'cname': 'foo.example.org.herokudns.com'}
    ])

    return certs.run({app: 'example'}).then(function () {
      expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... done\n')
      expect(cli.stdout).to.equal(
`=== Your certificate will now be managed by Heroku.  Check the status by running heroku certs:auto.
`)
      domainsApi.done()
      acmApi.done()
    })
  })

  it('enables acm with changed domains', function () {
    let acmApi = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.cedar-acm'}
    })
    acmApi.post('/apps/example/acm', {}).reply(200, {acm: true})

    let domainsApi = nock('https://api.heroku.com')
    domainsApi.get('/apps/example/domains').reply(200, [
      {'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null},
      {'kind': 'custom', 'hostname': 'foo.example.org', 'cname': 'haiku.not-stable-dns.heroku.com'},
      {'kind': 'custom', 'hostname': 'bar.example.org', 'cname': 'bar.example.org.herokudns.com'}
    ])

    domainsApi.get('/apps/example/domains').reply(200, [
      {'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null},
      {'kind': 'custom', 'hostname': 'foo.example.org', 'cname': 'foo.example.org.herokudns.com'},
      {'kind': 'custom', 'hostname': 'bar.example.org', 'cname': 'bar.example.org.herokudns.com'},
      {'kind': 'custom', 'hostname': 'mis.example.org', 'cname': 'mis.example.org.herokudns.com'}
    ])

    return certs.run({app: 'example'}).then(function () {
      expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... done\n')
      expect(cli.stdout).to.equal(
`=== Your certificate will now be managed by Heroku.  Check the status by running heroku certs:auto.  Update your application's DNS settings as follows
Domain           Record Type  DNS Target
───────────────  ───────────  ─────────────────────────────
foo.example.org  CNAME        foo.example.org.herokudns.com
`)
      domainsApi.done()
      acmApi.done()
    })
  })

  it('enables acm with no domains', function () {
    let acmApi = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.cedar-acm'}
    })
    acmApi.post('/apps/example/acm', {}).reply(200, {acm: true})

    let domainsApi = nock('https://api.heroku.com')
    domainsApi.get('/apps/example/domains').reply(200, [])
    domainsApi.get('/apps/example/domains').reply(200, [])

    return certs.run({app: 'example'}).then(function () {
      expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... done\n')
      expect(cli.stdout).to.equal('=== Your certificate will now be managed by Heroku.  Check the status by running heroku certs:auto.  Add a custom domain to your app by running heroku domains:add <yourdomain.com>\n')
      domainsApi.done()
      acmApi.done()
    })
  })
})
