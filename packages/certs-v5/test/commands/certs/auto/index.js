/* eslint-env mocha */
'use strict'
/* globals cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../../commands/certs/auto')
const sinon = require('sinon')
const lolex = require('lolex')

let letsEncrypt = {
  ssl_cert: {
    cert_domains: ['heroku-acm.heroku-cli-sni-test.com', 'heroku-san-test.heroku-cli-sni-test.com'],
    issuer: "/C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3",
    expires_at: '2012-08-01T21:34:23Z',
    starts_at: '2013-08-01T21:34:23Z',
    subject: '/CN=heroku-acm.heroku-cli-sni-test.com',
    acm: true,
  },
}

let selfSigned = {
  ssl_cert: {
    cert_domains: ['heroku-certs-test-update.com'],
    issuer: 'CN=heroku-certs-test-update.com',
  },
}

describe('heroku certs:auto', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('displays enabled status message', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    let apiCerts = nock('https://api.heroku.com')
    let now = new Date().toISOString()

    api.get('/apps/example').reply(200, {acm: true})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [letsEncrypt])
    api.get('/apps/example/domains').reply(200, [
      {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
      {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
      {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
    ])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Automatic Certificate Management is enabled on example

Certificate details:
Common Name(s): heroku-acm.heroku-cli-sni-test.com
                heroku-san-test.heroku-cli-sni-test.com
Expires At:     2012-08-01 21:34 UTC
Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
Starts At:      2013-08-01 21:34 UTC
Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
SSL certificate is not trusted.

Domain                                   Status  Last Updated
───────────────────────────────────────  ──────  ──────────────────
heroku-acm.heroku-cli-sni-test.com       OK      less than a minute
heroku-san-test.heroku-cli-sni-test.com  OK      less than a minute
`)
      api.done()
      apiCerts.done()
    })
  })

  it('displays partially enabled status message', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    let apiCerts = nock('https://api.heroku.com')
    let now = new Date().toISOString()

    api.get('/apps/example').reply(200, {acm: true})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [letsEncrypt])
    api.get('/apps/example/domains').reply(200, [
      {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
      {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
      {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
      {kind: 'custom', hostname: 'heroku-in-prog.heroku-cli-sni-test.com', cname: 'heroku-in-prog.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
      {kind: 'custom', hostname: 'heroku-verified.heroku-cli-sni-test.com', cname: 'heroku-verified.heroku-cli-sni-test.com.herokudns.com', acm_status: 'verified', updated_at: now},
      {kind: 'custom', hostname: 'heroku-dns-verified.heroku-cli-sni-test.com', cname: 'heroku-dns-verified.heroku-cli-sni-test.com.herokudns.com', acm_status: 'dns-verified', updated_at: now},
      {kind: 'custom', hostname: 'heroku-missing.heroku-cli-sni-test.com', cname: 'heroku-missing.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
      {kind: 'custom', hostname: 'heroku-unknown.heroku-cli-sni-test.com', cname: 'heroku-unknown.heroku-cli-sni-test.com.herokudns.com', acm_status: null, updated_at: now},
    ])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Automatic Certificate Management is enabled on example

Certificate details:
Common Name(s): heroku-acm.heroku-cli-sni-test.com
                heroku-san-test.heroku-cli-sni-test.com
Expires At:     2012-08-01 21:34 UTC
Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
Starts At:      2013-08-01 21:34 UTC
Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
SSL certificate is not trusted.

Domain                                       Status        Last Updated
───────────────────────────────────────────  ────────────  ──────────────────
heroku-acm.heroku-cli-sni-test.com           OK            less than a minute
heroku-san-test.heroku-cli-sni-test.com      OK            less than a minute
heroku-in-prog.heroku-cli-sni-test.com       In Progress   less than a minute
heroku-verified.heroku-cli-sni-test.com      In Progress   less than a minute
heroku-dns-verified.heroku-cli-sni-test.com  DNS Verified  less than a minute
heroku-missing.heroku-cli-sni-test.com       Failing       less than a minute
heroku-unknown.heroku-cli-sni-test.com       Waiting       less than a minute

=== Some domains are failing validation, please verify that your DNS matches: heroku domains
    See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons
`)
      api.done()
      apiCerts.done()
    })
  })

  it('does not have a false positive check with non-ACM lets encrypt certs', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    let apiCerts = nock('https://api.heroku.com')

    let sslCert = Object.assign({}, letsEncrypt.ssl_cert, {acm: false})

    let acmFalse = Object.assign({}, letsEncrypt, {ssl_cert: sslCert})

    let now = new Date().toISOString()

    api.get('/apps/example').reply(200, {acm: true})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [acmFalse])
    api.get('/apps/example/domains').reply(200, [
      {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
      {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
      {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
      {kind: 'custom', hostname: 'heroku-missing.heroku-cli-sni-test.com', cname: 'heroku-missing.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
      {kind: 'custom', hostname: 'heroku-unknown.heroku-cli-sni-test.com', cname: 'heroku-unknown.heroku-cli-sni-test.com.herokudns.com', acm_status: null, updated_at: now},
    ])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Automatic Certificate Management is enabled on example

Domain                                   Status   Last Updated
───────────────────────────────────────  ───────  ──────────────────
heroku-acm.heroku-cli-sni-test.com       OK       less than a minute
heroku-san-test.heroku-cli-sni-test.com  OK       less than a minute
heroku-missing.heroku-cli-sni-test.com   Failing  less than a minute
heroku-unknown.heroku-cli-sni-test.com   Waiting  less than a minute

=== Some domains are failing validation, please verify that your DNS matches: heroku domains
    See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons
`)
      api.done()
      apiCerts.done()
    })
  })

  it('displays partially enabled status with failed message', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    let apiCerts = nock('https://api.heroku.com')
    let now = new Date().toISOString()

    api.get('/apps/example').reply(200, {acm: true})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [letsEncrypt])
    api.get('/apps/example/domains').reply(200, [
      {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
      {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
      {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
      {kind: 'custom', hostname: 'heroku-failed.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failed', updated_at: now},
    ])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Automatic Certificate Management is enabled on example

Certificate details:
Common Name(s): heroku-acm.heroku-cli-sni-test.com
                heroku-san-test.heroku-cli-sni-test.com
Expires At:     2012-08-01 21:34 UTC
Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
Starts At:      2013-08-01 21:34 UTC
Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
SSL certificate is not trusted.

Domain                                   Status  Last Updated
───────────────────────────────────────  ──────  ──────────────────
heroku-acm.heroku-cli-sni-test.com       OK      less than a minute
heroku-san-test.heroku-cli-sni-test.com  OK      less than a minute
heroku-failed.heroku-cli-sni-test.com    Failed  less than a minute

=== Some domains failed validation after multiple attempts, retry by running: heroku certs:auto:refresh
    See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons
`)
      api.done()
      apiCerts.done()
    })
  })

  it('displays partially enabled status with failing message', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })
    let apiCerts = nock('https://api.heroku.com')
    let now = new Date().toISOString()

    api.get('/apps/example').reply(200, {acm: true})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [letsEncrypt])
    api.get('/apps/example/domains').reply(200, [
      {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
      {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
      {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
      {kind: 'custom', hostname: 'heroku-failed.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
    ])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Automatic Certificate Management is enabled on example

Certificate details:
Common Name(s): heroku-acm.heroku-cli-sni-test.com
                heroku-san-test.heroku-cli-sni-test.com
Expires At:     2012-08-01 21:34 UTC
Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
Starts At:      2013-08-01 21:34 UTC
Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
SSL certificate is not trusted.

Domain                                   Status   Last Updated
───────────────────────────────────────  ───────  ──────────────────
heroku-acm.heroku-cli-sni-test.com       OK       less than a minute
heroku-san-test.heroku-cli-sni-test.com  OK       less than a minute
heroku-failed.heroku-cli-sni-test.com    Failing  less than a minute

=== Some domains are failing validation, please verify that your DNS matches: heroku domains
    See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons
`)
      api.done()
      apiCerts.done()
    })
  })

  it('displays disabled status message', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    let apiCerts = nock('https://api.heroku.com')

    api.get('/apps/example').reply(200, {acm: false})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [letsEncrypt])
    api.get('/apps/example/domains').reply(200, [])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal('=== Automatic Certificate Management is disabled on example\n')
      api.done()
      apiCerts.done()
    })
  })

  it('displays message that there are no certificates', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    let apiCerts = nock('https://api.heroku.com')
    let now = new Date().toISOString()

    api.get('/apps/example').reply(200, {acm: true})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [])
    api.get('/apps/example/domains').reply(200, [
      {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
      {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
      {kind: 'custom', hostname: 'heroku-failing.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
    ])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Automatic Certificate Management is enabled on example

Domain                                  Status   Last Updated
──────────────────────────────────────  ───────  ──────────────────
heroku-acm.heroku-cli-sni-test.com      OK       less than a minute
heroku-failing.heroku-cli-sni-test.com  Failing  less than a minute

=== Some domains are failing validation, please verify that your DNS matches: heroku domains
    See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons
`)
      api.done()
      apiCerts.done()
    })
  })

  it('displays message that there are no domains', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    let apiCerts = nock('https://api.heroku.com')

    api.get('/apps/example').reply(200, {acm: true})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [])
    api.get('/apps/example/domains').reply(200, [
      {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
    ])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Automatic Certificate Management is enabled on example

=== Add a custom domain to your app by running: heroku domains:add <yourdomain.com>
`)
      api.done()
      apiCerts.done()
    })
  })

  it('does not displays message that there are no certificates', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    let apiCerts = nock('https://api.heroku.com')

    api.get('/apps/example').reply(200, {acm: false})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [])
    api.get('/apps/example/domains').reply(200, [])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal('=== Automatic Certificate Management is disabled on example\n')
      api.done()
      apiCerts.done()
    })
  })

  it('displays message that there are not acm certificates', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    let apiCerts = nock('https://api.heroku.com')

    api.get('/apps/example').reply(200, {acm: true})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [selfSigned])
    api.get('/apps/example/domains').reply(200, [])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Automatic Certificate Management is enabled on example

=== Add a custom domain to your app by running: heroku domains:add <yourdomain.com>
`)
      api.done()
      apiCerts.done()
    })
  })

  it('does not displays message that there are not acm certificates', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    let apiCerts = nock('https://api.heroku.com')

    api.get('/apps/example').reply(200, {acm: false})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [selfSigned])
    api.get('/apps/example/domains').reply(200, [])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal('=== Automatic Certificate Management is disabled on example\n')
      api.done()
      apiCerts.done()
    })
  })

  it('shows acm_status_reason', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    let apiCerts = nock('https://api.heroku.com')
    let now = new Date().toISOString()

    api.get('/apps/example').reply(200, {acm: true})
    apiCerts.get('/apps/example/sni-endpoints').reply(200, [letsEncrypt])
    api.get('/apps/example/domains').reply(200, [
      {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'ok', updated_at: now},
      {kind: 'custom', hostname: 'heroku-failed.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failed', acm_status_reason: 'uh oh something failed', updated_at: now},
    ])

    return certs.run({app: 'example', flags: {wait: false}}).then(function () {
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Automatic Certificate Management is enabled on example

Certificate details:
Common Name(s): heroku-acm.heroku-cli-sni-test.com
                heroku-san-test.heroku-cli-sni-test.com
Expires At:     2012-08-01 21:34 UTC
Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
Starts At:      2013-08-01 21:34 UTC
Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
SSL certificate is not trusted.

Domain                                 Status  Reason                  Last Updated
─────────────────────────────────────  ──────  ──────────────────────  ──────────────────
heroku-acm.heroku-cli-sni-test.com     OK                              less than a minute
heroku-failed.heroku-cli-sni-test.com  Failed  uh oh something failed  less than a minute

=== Some domains failed validation after multiple attempts, retry by running: heroku certs:auto:refresh
    See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons
`)
      api.done()
      apiCerts.done()
    })
  })
  context('--wait', function () {
    let clock
    let sandbox

    beforeEach(() => {
      sandbox = sinon.sandbox.create()
      clock = lolex.install()
      clock.setTimeout = function (fn, timeout) {
        fn()
      }
    })

    afterEach(function () {
      clock.uninstall()
      sandbox.restore()
    })

    it('waits until certs are issued and displays the domains details', function () {
      let api = nock('https://api.heroku.com', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
      })
      let apiDomains = nock('https://api.heroku.com')
      let apiCerts = nock('https://api.heroku.com')
      let now = new Date().toISOString()

      api.get('/apps/example').reply(200, {acm: true})
      apiCerts.get('/apps/example/sni-endpoints').reply(200, [])
      api.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-failing.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
      ])
      apiDomains.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-failing.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
      ])
      apiDomains.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-failing.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
      ])
      api.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-failing.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
      ])

      return certs.run({app: 'example', flags: {wait: true}, args: ['--wait']}).then(function () {
        expect(cli.stderr).to.equal('Waiting until the certificate is issued to all domains... done\n')
        expect(cli.stdout).to.equal(
          `=== Automatic Certificate Management is enabled on example

Domain                                  Status       Last Updated
──────────────────────────────────────  ───────────  ──────────────────
heroku-acm.heroku-cli-sni-test.com      Cert issued  less than a minute
heroku-failing.heroku-cli-sni-test.com  Cert issued  less than a minute
`)
        api.done()
        apiDomains.done()
        apiCerts.done()
      })
    })

    it('waits until certs are issued or failed and displays the domains details ignoring errors while waiting', function () {
      let api = nock('https://api.heroku.com', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
      })
      let apiDomains = nock('https://api.heroku.com')
      let apiCerts = nock('https://api.heroku.com')
      let now = new Date().toISOString()

      api.get('/apps/example').reply(200, {acm: true})
      apiCerts.get('/apps/example/sni-endpoints').reply(200, [])
      api.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-failing.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
      ])
      apiDomains.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-failing.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
      ])
      apiDomains.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-failing.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failed', updated_at: now},
      ])
      api.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-failing.heroku-cli-sni-test.com', cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failed', updated_at: now},
      ])

      return certs.run({app: 'example', flags: {wait: true}, args: ['--wait']}).then(function () {
        expect(cli.stderr).to.equal('Waiting until the certificate is issued to all domains... !\n')
        expect(cli.stdout).to.equal(
          `=== Automatic Certificate Management is enabled on example

Domain                                  Status       Last Updated
──────────────────────────────────────  ───────────  ──────────────────
heroku-acm.heroku-cli-sni-test.com      Cert issued  less than a minute
heroku-failing.heroku-cli-sni-test.com  Failed       less than a minute

=== Some domains failed validation after multiple attempts, retry by running: heroku certs:auto:refresh
    See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons
`)
        api.done()
        apiDomains.done()
        apiCerts.done()
      })
    })
  })
})
