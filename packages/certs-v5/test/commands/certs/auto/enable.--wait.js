'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../../commands/certs/auto/enable.js')
const sinon = require('sinon')
const lolex = require('lolex')

describe('heroku certs:auto:enable --wait', function () {
  let clock
  let sandbox

  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
    sandbox = sinon.sandbox.create()
    clock = lolex.install()
    clock.setTimeout = function (fn, timeout) { fn() }
  })

  afterEach(function () {
    clock.uninstall()
    sandbox.restore()
  })

  it('waits until all certs are issued and notifies', () => {
    const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

    let acmApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    })
    acmApi.post('/apps/example/acm', {}).reply(200, { acm: true })

    let domainsApi = nock('https://api.heroku.com')
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com'},
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com'},
    ])
    let now = new Date().toISOString()
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'in-progress', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'in-progress', 'updated_at': now },
    ])
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'dns-verified', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'failing', 'updated_at': now },
    ])
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'cert issued', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'cert issued', 'updated_at': now },
    ])
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'cert issued', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'cert issued', 'updated_at': now },
    ])

    return certs.run({
      app: 'example',
      args: ['--wait'],
      flags: {wait: true}
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
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    })
    acmApi.post('/apps/example/acm', {}).reply(200, { acm: true })

    let domainsApi = nock('https://api.heroku.com')
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com'},
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com'},
    ])
    let now = new Date().toISOString()
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'in-progress', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'in-progress', 'updated_at': now },
    ])
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'dns-verified', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'failing', 'updated_at': now },
    ])
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'cert issued', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'failed', 'updated_at': now },
    ])
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'cert issued', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'failed', 'updated_at': now },
    ])

    return certs.run({
      app: 'example',
      args: ['--wait'],
      flags: {wait: true}
    })
      .then(function () {
        expect(notifySpy.called).to.equal(true)
        expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... starting.\nWaiting until the certificate is issued to all domains... done\n')
        expect(cli.stdout).to.equal('=== Your certificate will now be managed by Heroku.  Check the status by running heroku certs:auto.\n')
        domainsApi.done()
        acmApi.done()
      })
  })

  it('waits until all certs are failed and notifies', () => {
    const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

    let acmApi = nock('https://api.heroku.com', {
      reqheaders: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    })
    acmApi.post('/apps/example/acm', {}).reply(200, { acm: true })

    let domainsApi = nock('https://api.heroku.com')
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com'},
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com'},
    ])
    let now = new Date().toISOString()
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'in-progress', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'in-progress', 'updated_at': now },
    ])
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'dns-verified', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'failing', 'updated_at': now },
    ])
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'failed', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'failed', 'updated_at': now },
    ])
    domainsApi.get('/apps/example/domains').reply(200, [
      { 'kind': 'heroku', 'hostname': 'tokyo-1050.herokuapp.com', 'cname': null },
      { 'kind': 'custom', 'hostname': 'heroku-acm.heroku-cli-sni-test.com', 'cname': 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'failed', 'updated_at': now },
      { 'kind': 'custom', 'hostname': 'heroku-san-test.heroku-cli-sni-test.com', 'cname': 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', 'acm_status': 'failed', 'updated_at': now },
    ])

    return certs.run({
      app: 'example',
      args: ['--wait'],
      flags: {wait: true}
    })
      .then(function () {
        expect(notifySpy.called).to.equal(true)
        expect(cli.stderr).to.equal('Enabling Automatic Certificate Management... starting.\nWaiting until the certificate is issued to all domains... done\n')
        expect(cli.stdout).to.equal('=== Your certificate will now be managed by Heroku.  Check the status by running heroku certs:auto.\n')
        domainsApi.done()
        acmApi.done()
      })
  })
})
