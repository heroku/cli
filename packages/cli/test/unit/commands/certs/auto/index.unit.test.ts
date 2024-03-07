import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../../src/commands/certs/auto/index'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import heredoc from 'tsheredoc'
import * as lolex from 'lolex'
import * as sinon from 'sinon'

const sandbox = sinon.createSandbox()
const letsEncrypt = {
  domains: [],
  ssl_cert: {
    cert_domains: ['heroku-acm.heroku-cli-sni-test.com', 'heroku-san-test.heroku-cli-sni-test.com'],
    issuer: "/C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3",
    expires_at: '2012-08-01T21:34:23Z',
    starts_at: '2013-08-01T21:34:23Z',
    subject: '/CN=heroku-acm.heroku-cli-sni-test.com',
    acm: true,
  },
}

const selfSigned = {
  ssl_cert: {
    cert_domains: ['heroku-certs-test-update.com'],
    issuer: 'CN=heroku-certs-test-update.com',
  },
}

describe('heroku certs:auto', () => {
  afterEach(function () {
    nock.cleanAll()
  })

  it('displays enabled status message', async () => {
    const now = new Date().toISOString()
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])
      .get('/apps/example/domains')
      .reply(200, [{
        kind: 'heroku',
        hostname: 'tokyo-1050.herokuapp.com',
        cname: null,
        acm_status: null,
      }, {
        kind: 'custom',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-san-test.heroku-cli-sni-test.com',
        cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal(heredoc`
      === Automatic Certificate Management is enabled on example

      Certificate details:
      Common Name(s): heroku-acm.heroku-cli-sni-test.com
                      heroku-san-test.heroku-cli-sni-test.com
      Expires At:     2012-08-01 21:34 UTC
      Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
      Starts At:      2013-08-01 21:34 UTC
      Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
      SSL certificate is not trusted.

       Domain                                  Status Last Updated       
       ─────────────────────────────────────── ────── ────────────────── 
       heroku-acm.heroku-cli-sni-test.com      OK     less than a minute 
       heroku-san-test.heroku-cli-sni-test.com OK     less than a minute 
    `)
  })

  it('displays partially enabled status message', async () => {
    const now = new Date().toISOString()
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])
      .get('/apps/example/domains')
      .reply(200, [{
        kind: 'heroku',
        hostname: 'tokyo-1050.herokuapp.com',
        cname: null,
        acm_status: null,
      }, {
        kind: 'custom',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-san-test.heroku-cli-sni-test.com',
        cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-in-prog.heroku-cli-sni-test.com',
        cname: 'heroku-in-prog.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'in-progress',
        updated_at: now,
      }, {
        kind: 'custom', hostname: 'heroku-verified.heroku-cli-sni-test.com',
        cname: 'heroku-verified.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'verified',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-dns-verified.heroku-cli-sni-test.com',
        cname: 'heroku-dns-verified.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'dns-verified',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-missing.heroku-cli-sni-test.com',
        cname: 'heroku-missing.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'failing',
        updated_at: now,
      }, {
        kind: 'custom', hostname: 'heroku-unknown.heroku-cli-sni-test.com',
        cname: 'heroku-unknown.heroku-cli-sni-test.com.herokudns.com',
        acm_status: null,
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal(heredoc`
      === Automatic Certificate Management is enabled on example

      Certificate details:
      Common Name(s): heroku-acm.heroku-cli-sni-test.com
                      heroku-san-test.heroku-cli-sni-test.com
      Expires At:     2012-08-01 21:34 UTC
      Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
      Starts At:      2013-08-01 21:34 UTC
      Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
      SSL certificate is not trusted.

       Domain                                      Status       Last Updated       
       ─────────────────────────────────────────── ──────────── ────────────────── 
       heroku-acm.heroku-cli-sni-test.com          OK           less than a minute 
       heroku-san-test.heroku-cli-sni-test.com     OK           less than a minute 
       heroku-in-prog.heroku-cli-sni-test.com      In Progress  less than a minute 
       heroku-verified.heroku-cli-sni-test.com     In Progress  less than a minute 
       heroku-dns-verified.heroku-cli-sni-test.com DNS Verified less than a minute 
       heroku-missing.heroku-cli-sni-test.com      Failing      less than a minute 
       heroku-unknown.heroku-cli-sni-test.com      Waiting      less than a minute 

      === Some domains are failing validation, please verify that your DNS matches: heroku domains
          See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
    `)
  })

  it('does not have a false positive check with non-ACM lets encrypt certs', async () => {
    const now = new Date().toISOString()
    const sslCert = {...letsEncrypt.ssl_cert, acm: false}
    const acmFalse = {...letsEncrypt, ssl_cert: sslCert}
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [acmFalse])
      .get('/apps/example/domains')
      .reply(200, [{
        kind: 'heroku',
        hostname: 'tokyo-1050.herokuapp.com',
        cname: null,
        acm_status: null,
      }, {
        kind: 'custom',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-san-test.heroku-cli-sni-test.com',
        cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-missing.heroku-cli-sni-test.com',
        cname: 'heroku-missing.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'failing',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-unknown.heroku-cli-sni-test.com',
        cname: 'heroku-unknown.heroku-cli-sni-test.com.herokudns.com',
        acm_status: null,
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal(heredoc`
      === Automatic Certificate Management is enabled on example

       Domain                                  Status  Last Updated       
       ─────────────────────────────────────── ─────── ────────────────── 
       heroku-acm.heroku-cli-sni-test.com      OK      less than a minute 
       heroku-san-test.heroku-cli-sni-test.com OK      less than a minute 
       heroku-missing.heroku-cli-sni-test.com  Failing less than a minute 
       heroku-unknown.heroku-cli-sni-test.com  Waiting less than a minute 

      === Some domains are failing validation, please verify that your DNS matches: heroku domains
          See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
    `)
  })

  it('displays partially enabled status with failed message', async () => {
    const now = new Date().toISOString()
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])
      .get('/apps/example/domains')
      .reply(200, [{
        kind: 'heroku',
        hostname: 'tokyo-1050.herokuapp.com',
        cname: null,
        acm_status: null,
      }, {
        kind: 'custom',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-san-test.heroku-cli-sni-test.com',
        cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-failed.heroku-cli-sni-test.com',
        cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'failed',
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal(heredoc`
      === Automatic Certificate Management is enabled on example

      Certificate details:
      Common Name(s): heroku-acm.heroku-cli-sni-test.com
                      heroku-san-test.heroku-cli-sni-test.com
      Expires At:     2012-08-01 21:34 UTC
      Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
      Starts At:      2013-08-01 21:34 UTC
      Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
      SSL certificate is not trusted.
      
       Domain                                  Status Last Updated       
       ─────────────────────────────────────── ────── ────────────────── 
       heroku-acm.heroku-cli-sni-test.com      OK     less than a minute 
       heroku-san-test.heroku-cli-sni-test.com OK     less than a minute 
       heroku-failed.heroku-cli-sni-test.com   Failed less than a minute 

      === Some domains failed validation after multiple attempts, retry by running: heroku certs:auto:refresh
          See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
    `)
  })

  it('displays partially enabled status with failing message', async () => {
    const now = new Date().toISOString()
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])
      .get('/apps/example/domains')
      .reply(200, [{
        kind: 'heroku',
        hostname: 'tokyo-1050.herokuapp.com',
        cname: null,
        acm_status: null,
      }, {
        kind: 'custom',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-san-test.heroku-cli-sni-test.com',
        cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-failed.heroku-cli-sni-test.com',
        cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'failing',
        updated_at: now}])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal(heredoc`
      === Automatic Certificate Management is enabled on example

      Certificate details:
      Common Name(s): heroku-acm.heroku-cli-sni-test.com
                      heroku-san-test.heroku-cli-sni-test.com
      Expires At:     2012-08-01 21:34 UTC
      Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
      Starts At:      2013-08-01 21:34 UTC
      Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
      SSL certificate is not trusted.
      
       Domain                                  Status  Last Updated       
       ─────────────────────────────────────── ─────── ────────────────── 
       heroku-acm.heroku-cli-sni-test.com      OK      less than a minute 
       heroku-san-test.heroku-cli-sni-test.com OK      less than a minute 
       heroku-failed.heroku-cli-sni-test.com   Failing less than a minute 
 
      === Some domains are failing validation, please verify that your DNS matches: heroku domains
          See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
    `)
  })

  it('displays disabled status message', async () => {
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: false})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal('=== Automatic Certificate Management is disabled on example\n\n')
  })

  it('displays message that there are no certificates', async () => {
    const now = new Date().toISOString()
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [])
      .get('/apps/example/domains')
      .reply(200, [{
        kind: 'heroku',
        hostname: 'tokyo-1050.herokuapp.com',
        cname: null,
        acm_status: null,
      }, {
        kind: 'custom',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-failing.heroku-cli-sni-test.com',
        cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'failing',
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal(heredoc`
      === Automatic Certificate Management is enabled on example

       Domain                                 Status  Last Updated       
       ────────────────────────────────────── ─────── ────────────────── 
       heroku-acm.heroku-cli-sni-test.com     OK      less than a minute 
       heroku-failing.heroku-cli-sni-test.com Failing less than a minute 

      === Some domains are failing validation, please verify that your DNS matches: heroku domains
          See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
    `)
  })

  it('displays message that there are no domains', async () => {
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [])
      .get('/apps/example/domains')
      .reply(200, [
        {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, acm_status: null},
      ])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal(heredoc`
      === Automatic Certificate Management is enabled on example

      === Add a custom domain to your app by running: heroku domains:add <yourdomain.com>\n
    `)
  })

  it('does not displays message that there are no certificates', async () => {
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: false})
      .get('/apps/example/sni-endpoints')
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal('=== Automatic Certificate Management is disabled on example\n\n')
  })

  it('displays message that there are no ACM certificates', async () => {
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [selfSigned])
      .get('/apps/example/domains')
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal(heredoc`
      === Automatic Certificate Management is enabled on example

      === Add a custom domain to your app by running: heroku domains:add <yourdomain.com>\n
    `)
  })

  it('does not displays message that there are not acm certificates', async () => {
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: false})
      .get('/apps/example/sni-endpoints')
      .reply(200, [selfSigned])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal('=== Automatic Certificate Management is disabled on example\n\n')
  })

  it('shows acm_status_reason', async () => {
    const now = new Date().toISOString()
    const api = nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])
      .get('/apps/example/domains')
      .reply(200, [{
        kind: 'custom',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'ok',
        updated_at: now,
      }, {
        kind: 'custom',
        hostname: 'heroku-failed.heroku-cli-sni-test.com',
        cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
        acm_status: 'failed',
        acm_status_reason: 'uh oh something failed',
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal(heredoc`
      === Automatic Certificate Management is enabled on example

      Certificate details:
      Common Name(s): heroku-acm.heroku-cli-sni-test.com
                      heroku-san-test.heroku-cli-sni-test.com
      Expires At:     2012-08-01 21:34 UTC
      Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
      Starts At:      2013-08-01 21:34 UTC
      Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
      SSL certificate is not trusted.
      
       Domain                                Status Reason                 Last Updated       
       ───────────────────────────────────── ────── ────────────────────── ────────────────── 
       heroku-acm.heroku-cli-sni-test.com    OK                            less than a minute 
       heroku-failed.heroku-cli-sni-test.com Failed uh oh something failed less than a minute 

      === Some domains failed validation after multiple attempts, retry by running: heroku certs:auto:refresh
          See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
    `)
  })

  context('--wait', () => {
    let clock: lolex.InstalledClock<lolex.Clock>

    beforeEach(() => {
      clock = lolex.install()
      clock.setTimeout = function (fn, _timeout) {
        fn()
        return 1
      }
    })

    afterEach(() => {
      clock.uninstall()
      sandbox.restore()
    })

    it('waits until certs are issued and displays the domains details', async () => {
      const now = new Date().toISOString()
      const api = nock('https://api.heroku.com')
        .get('/apps/example')
        .reply(200, {acm: true})
        .get('/apps/example/sni-endpoints')
        .reply(200, [])
        .get('/apps/example/domains')
        .reply(200, [{
          kind: 'heroku',
          hostname: 'tokyo-1050.herokuapp.com',
          cname: null,
          acm_status: null,
        }, {
          kind: 'custom',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'cert issued',
          updated_at: now,
        }, {
          kind: 'custom',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'failing',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          kind: 'heroku',
          hostname: 'tokyo-1050.herokuapp.com',
          cname: null,
          acm_status: null,
        }, {
          kind: 'custom',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'cert issued',
          updated_at: now,
        }, {
          kind: 'custom',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'failing',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          kind: 'heroku',
          hostname: 'tokyo-1050.herokuapp.com',
          cname: null,
          acm_status: null,
        }, {
          kind: 'custom',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'cert issued',
          updated_at: now,
        }, {
          kind: 'custom',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'cert issued',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          kind: 'heroku',
          hostname: 'tokyo-1050.herokuapp.com',
          cname: null,
          acm_status: null,
        }, {
          kind: 'custom',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'cert issued',
          updated_at: now,
        }, {
          kind: 'custom',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'cert issued',
          updated_at: now,
        }])

      await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ])

      api.done()

      expect(stderr.output).to.equal(heredoc`
        Waiting until the certificate is issued to all domains...
        Waiting until the certificate is issued to all domains... done
      `)
      expect(stdout.output).to.equal(heredoc`
        === Automatic Certificate Management is enabled on example

         Domain                                 Status      Last Updated       
         ────────────────────────────────────── ─────────── ────────────────── 
         heroku-acm.heroku-cli-sni-test.com     Cert issued less than a minute 
         heroku-failing.heroku-cli-sni-test.com Cert issued less than a minute 
      `)
    })

    it('waits until certs are issued or failed and displays the domains details ignoring errors while waiting', async () => {
      const now = new Date().toISOString()
      const api = nock('https://api.heroku.com')
        .get('/apps/example')
        .reply(200, {acm: true})
        .get('/apps/example/sni-endpoints')
        .reply(200, [])
        .get('/apps/example/domains')
        .reply(200, [{
          kind: 'heroku',
          hostname: 'tokyo-1050.herokuapp.com',
          cname: null,
          acm_status: null,
        }, {
          kind: 'custom',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'cert issued',
          updated_at: now,
        }, {
          kind: 'custom',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'failing',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          kind: 'heroku',
          hostname: 'tokyo-1050.herokuapp.com',
          cname: null,
          acm_status: null,
        }, {
          kind: 'custom',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'cert issued',
          updated_at: now,
        }, {
          kind: 'custom',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'failing',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          kind: 'heroku',
          hostname: 'tokyo-1050.herokuapp.com',
          cname: null,
          acm_status: null,
        }, {
          kind: 'custom',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'cert issued',
          updated_at: now,
        }, {
          kind: 'custom',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'failed',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          kind: 'heroku',
          hostname: 'tokyo-1050.herokuapp.com',
          cname: null,
          acm_status: null,
        }, {
          kind: 'custom',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'cert issued',
          updated_at: now,
        }, {
          kind: 'custom',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          acm_status: 'failed',
          updated_at: now,
        }])

      await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ])

      api.done()

      expect(stderr.output).to.equal(heredoc`
        Waiting until the certificate is issued to all domains...
        Waiting until the certificate is issued to all domains... !
      `)
      expect(stdout.output).to.equal(heredoc`
        === Automatic Certificate Management is enabled on example

         Domain                                 Status      Last Updated       
         ────────────────────────────────────── ─────────── ────────────────── 
         heroku-acm.heroku-cli-sni-test.com     Cert issued less than a minute 
         heroku-failing.heroku-cli-sni-test.com Failed      less than a minute 

        === Some domains failed validation after multiple attempts, retry by running: heroku certs:auto:refresh
            See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
      `)
    })
  })
})
