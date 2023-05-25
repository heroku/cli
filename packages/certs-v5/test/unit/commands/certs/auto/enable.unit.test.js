/* eslint-env mocha */
'use strict'
/* globals cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../../../commands/certs/auto/enable.js')
const sinon = require('sinon')
const lolex = require('lolex')

describe('heroku certs:auto:enable', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('enables acm with domains', function () {
    let acmApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })
    acmApi.post('/apps/example/acm', {}).reply(200, {acm: true})

    let domainsApi = nock('https://api.heroku.com')
    domainsApi.get('/apps/example/domains').reply(200, [
      {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
      {kind: 'custom', hostname: 'foo.example.org', cname: 'foo.example.org.herokudns.com'},
    ])

    domainsApi.get('/apps/example/domains').reply(200, [
      {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
      {kind: 'custom', hostname: 'foo.example.org', cname: 'foo.example.org.herokudns.com'},
    ])

    return certs.run({
      app: 'example',
      flags: {wait: false},
    })
      .then(function () {
        expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... starting. See status with heroku certs:auto or wait until active with heroku certs:auto --wait\n')
        expect(cli.stdout).to.equal(
          `=== Your certificate will now be managed by Heroku.  Check the status by running heroku certs:auto.
`)
        domainsApi.done()
        acmApi.done()
      })
  })

  it('enables acm with changed domains', function () {
    let acmApi = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })
    acmApi.post('/apps/example/acm', {}).reply(200, {acm: true})

    let domainsApi = nock('https://api.heroku.com')
    domainsApi.get('/apps/example/domains').reply(200, [
      {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
      {kind: 'custom', hostname: 'foo.example.org', cname: 'haiku.not-stable-dns.heroku.com'},
      {kind: 'custom', hostname: 'bar.example.org', cname: 'bar.example.org.herokudns.com'},
    ])

    domainsApi.get('/apps/example/domains').reply(200, [
      {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
      {kind: 'custom', hostname: 'foo.example.org', cname: 'foo.example.org.herokudns.com'},
      {kind: 'custom', hostname: 'bar.example.org', cname: 'bar.example.org.herokudns.com'},
      {kind: 'custom', hostname: 'mis.example.org', cname: 'mis.example.org.herokudns.com'},
    ])

    return certs.run({
      app: 'example',
      flags: {wait: false},
    })
      .then(function () {
        expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... starting. See status with heroku certs:auto or wait until active with heroku certs:auto --wait\n')
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
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })
    acmApi.post('/apps/example/acm', {}).reply(200, {acm: true})

    let domainsApi = nock('https://api.heroku.com')
    domainsApi.get('/apps/example/domains').reply(200, [])
    domainsApi.get('/apps/example/domains').reply(200, [])

    return certs.run({
      app: 'example',
      flags: {wait: false},
    })
      .then(function () {
        expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... starting. See status with heroku certs:auto or wait until active with heroku certs:auto --wait\n')
        expect(cli.stdout).to.equal('=== Your certificate will now be managed by Heroku.  Check the status by running heroku certs:auto.  Add a custom domain to your app by running heroku domains:add <yourdomain.com>\n')
        domainsApi.done()
        acmApi.done()
      })
  })

  context('--wait', function () {
    let clock
    let sandbox

    beforeEach(function () {
      cli.mockConsole()
      nock.cleanAll()
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

    it('waits until all certs are issued and notifies', () => {
      const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

      let acmApi = nock('https://api.heroku.com', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
      })
      acmApi.post('/apps/example/acm', {}).reply(200, {acm: true})

      let domainsApi = nock('https://api.heroku.com')
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com'},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com'},
      ])
      let now = new Date().toISOString()
      // Process started
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
      ])
      // One cert is failing, could be a temporary issue, we need to retry the check later
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'dns-verified', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
      ])
      // Issue resolved, both domains have their certs issued
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
      ])
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
      ])

      return certs.run({
        app: 'example',
        args: ['--wait'],
        flags: {wait: true},
      })
        .then(function () {
          expect(notifySpy.called).to.equal(true)
          expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... starting.\nWaiting until the certificate is issued to all domains... done\n')
          expect(cli.stdout).to.equal('=== Your certificate will now be managed by Heroku.  Check the status by running heroku certs:auto.\n')
          domainsApi.done()
          acmApi.done()
        })
    })

    it('waits until all certs are issued or failed and notifies', () => {
      const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

      let acmApi = nock('https://api.heroku.com', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
      })
      acmApi.post('/apps/example/acm', {}).reply(200, {acm: true})

      let domainsApi = nock('https://api.heroku.com')
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com'},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com'},
      ])
      let now = new Date().toISOString()
      // Process started
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
      ])
      // One cert is failing, could be a temporary issue, we need to retry the check later
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'dns-verified', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
      ])
      // Issue not resolved, we stopped retrying
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failed', updated_at: now},
      ])

      return certs.run({
        app: 'example',
        args: ['--wait'],
        flags: {wait: true},
      })
        .catch(function (error) {
          expect(error.message).to.equal('ACM not enabled for some domains')
          expect(notifySpy.called).to.equal(true)
          expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... starting.\nWaiting until the certificate is issued to all domains... !\n')
          expect(cli.stdout).to.equal('=== Error: The certificate could not be issued to all domains. See status with heroku certs:auto.\n')
          domainsApi.done()
          acmApi.done()
        })
    })

    it('waits until all certs are failed and notifies', () => {
      const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

      let acmApi = nock('https://api.heroku.com', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
      })
      acmApi.post('/apps/example/acm', {}).reply(200, {acm: true})

      let domainsApi = nock('https://api.heroku.com')
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com'},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com'},
      ])
      let now = new Date().toISOString()
      // Process started
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
      ])
      // One cert is failing, could be a temporary issue, we need to retry the check later
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'dns-verified', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
      ])
      // Issue not resolved, we stopped retrying, and the cert for the other domain also failed
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failed', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failed', updated_at: now},
      ])

      return certs.run({
        app: 'example',
        args: ['--wait'],
        flags: {wait: true},
      })
        .catch(function (error) {
          expect(error.message).to.equal('ACM not enabled for some domains')
          expect(notifySpy.called).to.equal(true)
          expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... starting.\nWaiting until the certificate is issued to all domains... !\n')
          expect(cli.stdout).to.equal('=== Error: The certificate could not be issued to all domains. See status with heroku certs:auto.\n')
          domainsApi.done()
          acmApi.done()
        })
    })

    it('does not wait if all certs are issued when first checked', () => {
      const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

      let acmApi = nock('https://api.heroku.com', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
      })
      acmApi.post('/apps/example/acm', {}).reply(200, {acm: true})

      let domainsApi = nock('https://api.heroku.com')
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com'},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com'},
      ])
      let now = new Date().toISOString()
      // Precess finished before the first check, no need to wait
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
      ])
      domainsApi.get('/apps/example/domains').reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
      ])

      return certs.run({
        app: 'example',
        args: ['--wait'],
        flags: {wait: true},
      })
        .then(function () {
          expect(notifySpy.called).to.equal(true)
          expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... starting.\n')
          expect(cli.stdout).to.equal('=== Your certificate will now be managed by Heroku.  Check the status by running heroku certs:auto.\n')
          domainsApi.done()
          acmApi.done()
        })
    })
  })
})
