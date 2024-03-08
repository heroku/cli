import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/certs/auto/enable'
import runCommand from '../../../../helpers/runCommand'
import {expect} from 'chai'
import * as sinon from 'sinon'
import * as nock from 'nock'
import * as lolex from 'lolex'
import heredoc from 'tsheredoc'

const sandbox = sinon.createSandbox()

describe('heroku certs:auto:enable', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('enables acm with domains', async () => {
    const acmApi = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'}})
      .post('/apps/example/acm', {})
      .reply(200, {acm: true})
    const domainsApi = nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'foo.example.org', cname: 'foo.example.org.herokudns.com'},
      ])
      .get('/apps/example/domains')
      .reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'foo.example.org', cname: 'foo.example.org.herokudns.com'},
      ])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    domainsApi.done()
    acmApi.done()

    expect(stderr.output).to.equal(heredoc`
      Enabling Automatic Certificate Management...
      Enabling Automatic Certificate Management... starting. See status with heroku certs:auto or wait until active with heroku certs:auto --wait
    `)
    expect(stdout.output).to.equal('=== Your certificate will now be managed by Heroku. Check the status by running heroku certs:auto.\n\n')
  })

  it('enables acm with changed domains', async () => {
    const acmApi = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'}})
      .post('/apps/example/acm', {})
      .reply(200, {acm: true})
    const domainsApi = nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'foo.example.org', cname: 'haiku.not-stable-dns.heroku.com'},
        {kind: 'custom', hostname: 'bar.example.org', cname: 'bar.example.org.herokudns.com'},
      ])
      .get('/apps/example/domains')
      .reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        {kind: 'custom', hostname: 'foo.example.org', cname: 'foo.example.org.herokudns.com'},
        {kind: 'custom', hostname: 'bar.example.org', cname: 'bar.example.org.herokudns.com'},
        {kind: 'custom', hostname: 'mis.example.org', cname: 'mis.example.org.herokudns.com'},
      ])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    domainsApi.done()
    acmApi.done()

    expect(stderr.output).to.equal(heredoc`
      Enabling Automatic Certificate Management...
      Enabling Automatic Certificate Management... starting. See status with heroku certs:auto or wait until active with heroku certs:auto --wait
    `)
    expect(stdout.output).to.equal(heredoc`
      === Your certificate will now be managed by Heroku. Check the status by running heroku certs:auto.  Update your application's DNS settings as follows

       Domain          Record Type DNS Target                    
       ─────────────── ─────────── ───────────────────────────── 
       foo.example.org CNAME       foo.example.org.herokudns.com 
    `)
  })

  it('enables acm with no domains', async () => {
    const acmApi = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'}})
      .post('/apps/example/acm', {})
      .reply(200, {acm: true})
    const domainsApi = nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [])
      .get('/apps/example/domains')
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    domainsApi.done()
    acmApi.done()

    expect(stderr.output).to.equal(heredoc`
      Enabling Automatic Certificate Management...
      Enabling Automatic Certificate Management... starting. See status with heroku certs:auto or wait until active with heroku certs:auto --wait
    `)
    expect(stdout.output).to.equal(
      '=== Your certificate will now be managed by Heroku. Check the status by running heroku certs:auto.  Add a custom domain to your app by running heroku domains:add <yourdomain.com>\n\n',
    )
  })

  context('--wait', function () {
    let clock: lolex.InstalledClock<lolex.Clock>

    beforeEach(function () {
      clock = lolex.install()
      clock.setTimeout = function (fn, _timeout) {
        fn()
        return 1
      }
    })

    afterEach(function () {
      clock.uninstall()
      sandbox.restore()
    })

    it('waits until all certs are issued and notifies', async () => {
      const now = new Date().toISOString()
      const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
      const acmApi = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'}})
        .post('/apps/example/acm', {})
        .reply(200, {acm: true})
      const domainsApi = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com'},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com'},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'dns-verified', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        ])

      await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ])

      domainsApi.done()
      acmApi.done()

      expect(notifySpy.called).to.equal(true)
      expect(stderr.output).to.equal(heredoc`
        Enabling Automatic Certificate Management...
        Enabling Automatic Certificate Management... starting.
        Waiting until the certificate is issued to all domains...
        Waiting until the certificate is issued to all domains... done
      `)
      expect(stdout.output).to.equal('=== Your certificate will now be managed by Heroku. Check the status by running heroku certs:auto.\n\n')
    })

    it('waits until all certs are issued or failed and notifies', async () => {
      const now = new Date().toISOString()
      const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
      const acmApi = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'}})
        .post('/apps/example/acm', {})
        .reply(200, {acm: true})
      const domainsApi = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com'},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com'},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'dns-verified', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failed', updated_at: now},
        ])

      await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ]).catch(function (error) {
        domainsApi.done()
        acmApi.done()

        expect(error.message).to.equal('ACM not enabled for some domains')
        expect(notifySpy.called).to.equal(true)
        expect(stderr.output).to.equal(heredoc`
          Enabling Automatic Certificate Management...
          Enabling Automatic Certificate Management... starting.
          Waiting until the certificate is issued to all domains...
          Waiting until the certificate is issued to all domains... !
        `)
        expect(stdout.output).to.equal('=== Error: The certificate could not be issued to all domains. See status with heroku certs:auto.\n\n')
      })
    })

    it('waits until all certs are failed and notifies', async () => {
      const now = new Date().toISOString()
      const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
      const acmApi = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'}})
        .post('/apps/example/acm', {})
        .reply(200, {acm: true})
      const domainsApi = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com'},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com'},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'in-progress', updated_at: now},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'dns-verified', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failing', updated_at: now},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failed', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'failed', updated_at: now},
        ])

      await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ]).catch(function (error: Error) {
        domainsApi.done()
        acmApi.done()

        expect(error.message).to.equal('ACM not enabled for some domains')
        expect(notifySpy.called).to.equal(true)
        expect(stderr.output).to.equal(heredoc`
          Enabling Automatic Certificate Management...
          Enabling Automatic Certificate Management... starting.
          Waiting until the certificate is issued to all domains...
          Waiting until the certificate is issued to all domains... !
        `)
        expect(stdout.output).to.equal('=== Error: The certificate could not be issued to all domains. See status with heroku certs:auto.\n\n')
      })
    })

    it('does not wait if all certs are issued when first checked', async () => {
      const now = new Date().toISOString()
      const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
      const acmApi = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'}})
        .post('/apps/example/acm', {})
        .reply(200, {acm: true})
      const domainsApi = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com'},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com'},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        ])
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
          {kind: 'custom', hostname: 'heroku-acm.heroku-cli-sni-test.com', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
          {kind: 'custom', hostname: 'heroku-san-test.heroku-cli-sni-test.com', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', acm_status: 'cert issued', updated_at: now},
        ])

      await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ])

      domainsApi.done()
      acmApi.done()

      expect(notifySpy.called).to.equal(true)
      expect(stderr.output).to.equal(heredoc`
        Enabling Automatic Certificate Management...
        Enabling Automatic Certificate Management... starting.
      `)
      expect(stdout.output).to.equal('=== Your certificate will now be managed by Heroku. Check the status by running heroku certs:auto.\n\n')
    })
  })
})
