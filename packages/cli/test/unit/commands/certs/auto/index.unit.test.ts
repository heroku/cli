import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/certs/auto/index.js'
import runCommand from '../../../../helpers/runCommand.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc.default
const sandbox = sinon.createSandbox()
const letsEncrypt = {
  domains: [],
  ssl_cert: {
    acm: true,
    cert_domains: ['heroku-acm.heroku-cli-sni-test.com', 'heroku-san-test.heroku-cli-sni-test.com'],
    expires_at: '2012-08-01T21:34:23Z',
    issuer: "/C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3",
    starts_at: '2013-08-01T21:34:23Z',
    subject: '/CN=heroku-acm.heroku-cli-sni-test.com',
  },
}

const selfSigned = {
  ssl_cert: {
    cert_domains: ['heroku-certs-test-update.com'],
    issuer: 'CN=heroku-certs-test-update.com',
  },
}

describe('heroku certs:auto', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('displays enabled status message', async function () {
    const now = new Date().toISOString()
    api
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])
      .get('/apps/example/domains')
      .reply(200, [{
        acm_status: null,
        cname: null,
        hostname: 'tokyo-1050.herokuapp.com',
        kind: 'heroku',
      }, {
        acm_status: 'ok',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'ok',
        cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-san-test.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.include('=== Automatic Certificate Management is enabled on ⬢ example')
    expect(stdout.output).to.include(heredoc`
      Certificate details:
      Common Name(s): heroku-acm.heroku-cli-sni-test.com
                      heroku-san-test.heroku-cli-sni-test.com
      Expires At:     2012-08-01 21:34 UTC
      Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
      Starts At:      2013-08-01 21:34 UTC
      Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
      SSL certificate is not trusted.
    `)
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Domain                                  Status Last Updated')
    const expected = removeAllWhitespace(heredoc(`
      heroku-acm.heroku-cli-sni-test.com      OK     less than a minute
      heroku-san-test.heroku-cli-sni-test.com OK     less than a minute`))
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('displays partially enabled status message', async function () {
    const now = new Date().toISOString()
    api
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])
      .get('/apps/example/domains')
      .reply(200, [{
        acm_status: null,
        cname: null,
        hostname: 'tokyo-1050.herokuapp.com',
        kind: 'heroku',
      }, {
        acm_status: 'ok',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'ok',
        cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-san-test.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'in-progress',
        cname: 'heroku-in-prog.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-in-prog.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'verified', cname: 'heroku-verified.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-verified.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'dns-verified',
        cname: 'heroku-dns-verified.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-dns-verified.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'failing',
        cname: 'heroku-missing.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-missing.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: null, cname: 'heroku-unknown.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-unknown.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stdout.output).to.include(heredoc`
      === Automatic Certificate Management is enabled on ⬢ example

      Certificate details:
      Common Name(s): heroku-acm.heroku-cli-sni-test.com
                      heroku-san-test.heroku-cli-sni-test.com
      Expires At:     2012-08-01 21:34 UTC
      Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
      Starts At:      2013-08-01 21:34 UTC
      Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
      SSL certificate is not trusted.
    `)
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Domain                                      Status       Last Updated')
    const expected = removeAllWhitespace(heredoc(`
      heroku-acm.heroku-cli-sni-test.com          OK           less than a minute
       heroku-san-test.heroku-cli-sni-test.com     OK           less than a minute
       heroku-in-prog.heroku-cli-sni-test.com      In Progress  less than a minute
       heroku-verified.heroku-cli-sni-test.com     In Progress  less than a minute
       heroku-dns-verified.heroku-cli-sni-test.com DNS Verified less than a minute
       heroku-missing.heroku-cli-sni-test.com      Failing      less than a minute
       heroku-unknown.heroku-cli-sni-test.com      Waiting      less than a minute

      === Some domains are failing validation, please verify that your DNS matches: heroku domains
          See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons
    `))
    expect(stderr.output).to.equal('')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('does not have a false positive check with non-ACM lets encrypt certs', async function () {
    const now = new Date().toISOString()
    const sslCert = {...letsEncrypt.ssl_cert, acm: false}
    const acmFalse = {...letsEncrypt, ssl_cert: sslCert}
    api
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [acmFalse])
      .get('/apps/example/domains')
      .reply(200, [{
        acm_status: null,
        cname: null,
        hostname: 'tokyo-1050.herokuapp.com',
        kind: 'heroku',
      }, {
        acm_status: 'ok',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'ok',
        cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-san-test.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'failing',
        cname: 'heroku-missing.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-missing.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: null,
        cname: 'heroku-unknown.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-unknown.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr.output).to.equal('')
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Domain                                  Status  Last Updated')
    const expected = removeAllWhitespace(heredoc(`
      heroku-acm.heroku-cli-sni-test.com      OK      less than a minute
      heroku-san-test.heroku-cli-sni-test.com OK      less than a minute
      heroku-missing.heroku-cli-sni-test.com  Failing less than a minute
      heroku-unknown.heroku-cli-sni-test.com  Waiting less than a minute

      === Some domains are failing validation, please verify that your DNS matches: heroku domains
          See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
    `))
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('displays partially enabled status with failed message', async function () {
    const now = new Date().toISOString()
    api
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])
      .get('/apps/example/domains')
      .reply(200, [{
        acm_status: null,
        cname: null,
        hostname: 'tokyo-1050.herokuapp.com',
        kind: 'heroku',
      }, {
        acm_status: 'ok',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'ok',
        cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-san-test.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'failed',
        cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-failed.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.include(heredoc`
      === Automatic Certificate Management is enabled on ⬢ example

      Certificate details:
      Common Name(s): heroku-acm.heroku-cli-sni-test.com
                      heroku-san-test.heroku-cli-sni-test.com
      Expires At:     2012-08-01 21:34 UTC
      Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
      Starts At:      2013-08-01 21:34 UTC
      Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
      SSL certificate is not trusted.
    `)
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Domain                                  Status Last Updated')
    const expected = removeAllWhitespace(heredoc(`
      heroku-acm.heroku-cli-sni-test.com      OK     less than a minute
      heroku-san-test.heroku-cli-sni-test.com OK     less than a minute
      heroku-failed.heroku-cli-sni-test.com   Failed less than a minute

      === Some domains failed validation after multiple attempts, retry by running: heroku certs:auto:refresh
          See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
    `))
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('displays partially enabled status with failing message', async function () {
    const now = new Date().toISOString()
    api
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])
      .get('/apps/example/domains')
      .reply(200, [{
        acm_status: null,
        cname: null,
        hostname: 'tokyo-1050.herokuapp.com',
        kind: 'heroku',
      }, {
        acm_status: 'ok',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'ok',
        cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-san-test.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'failing',
        cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-failed.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now}])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.include(heredoc`
      === Automatic Certificate Management is enabled on ⬢ example

      Certificate details:
      Common Name(s): heroku-acm.heroku-cli-sni-test.com
                      heroku-san-test.heroku-cli-sni-test.com
      Expires At:     2012-08-01 21:34 UTC
      Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
      Starts At:      2013-08-01 21:34 UTC
      Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
      SSL certificate is not trusted.
    `)
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Domain                                  Status  Last Updated')
    const expected = removeAllWhitespace(heredoc(`
      heroku-acm.heroku-cli-sni-test.com      OK      less than a minute
      heroku-san-test.heroku-cli-sni-test.com OK      less than a minute
      heroku-failed.heroku-cli-sni-test.com   Failing less than a minute

      === Some domains are failing validation, please verify that your DNS matches: heroku domains
          See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
    `))
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('displays disabled status message', async function () {
    api
      .get('/apps/example')
      .reply(200, {acm: false})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal('=== Automatic Certificate Management is disabled on ⬢ example\n\n')
  })

  it('displays message that there are no certificates', async function () {
    const now = new Date().toISOString()
    api
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [])
      .get('/apps/example/domains')
      .reply(200, [{
        acm_status: null,
        cname: null,
        hostname: 'tokyo-1050.herokuapp.com',
        kind: 'heroku',
      }, {
        acm_status: 'ok',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'failing',
        cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-failing.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.include('=== Automatic Certificate Management is enabled on ⬢ example')
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Domain                                 Status  Last Updated')
    const expected = removeAllWhitespace(heredoc(`
      heroku-acm.heroku-cli-sni-test.com     OK      less than a minute
      heroku-failing.heroku-cli-sni-test.com Failing less than a minute
    `))
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('displays message that there are no domains', async function () {
    api
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [])
      .get('/apps/example/domains')
      .reply(200, [
        {acm_status: null, cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
      ])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal(heredoc`
      === Automatic Certificate Management is enabled on ⬢ example

      === Add a custom domain to your app by running: heroku domains:add <yourdomain.com>\n
    `)
  })

  it('does not displays message that there are no certificates', async function () {
    api
      .get('/apps/example')
      .reply(200, {acm: false})
      .get('/apps/example/sni-endpoints')
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal('=== Automatic Certificate Management is disabled on ⬢ example\n\n')
  })

  it('displays message that there are no ACM certificates', async function () {
    api
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

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal(heredoc`
      === Automatic Certificate Management is enabled on ⬢ example

      === Add a custom domain to your app by running: heroku domains:add <yourdomain.com>\n
    `)
  })

  it('does not displays message that there are not acm certificates', async function () {
    api
      .get('/apps/example')
      .reply(200, {acm: false})
      .get('/apps/example/sni-endpoints')
      .reply(200, [selfSigned])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal('=== Automatic Certificate Management is disabled on ⬢ example\n\n')
  })

  it('shows acm_status_reason', async function () {
    const now = new Date().toISOString()
    api
      .get('/apps/example')
      .reply(200, {acm: true})
      .get('/apps/example/sni-endpoints')
      .reply(200, [letsEncrypt])
      .get('/apps/example/domains')
      .reply(200, [{
        acm_status: 'ok',
        cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-acm.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }, {
        acm_status: 'failed',
        acm_status_reason: 'uh oh something failed',
        cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
        hostname: 'heroku-failed.heroku-cli-sni-test.com',
        kind: 'custom',
        updated_at: now,
      }])

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.include(heredoc`
      === Automatic Certificate Management is enabled on ⬢ example

      Certificate details:
      Common Name(s): heroku-acm.heroku-cli-sni-test.com
                      heroku-san-test.heroku-cli-sni-test.com
      Expires At:     2012-08-01 21:34 UTC
      Issuer:         /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
      Starts At:      2013-08-01 21:34 UTC
      Subject:        /CN=heroku-acm.heroku-cli-sni-test.com
      SSL certificate is not trusted.
    `)
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Domain                                Status Reason                 Last Updated')
    const expected = removeAllWhitespace(heredoc(`
      heroku-acm.heroku-cli-sni-test.com    OK                            less than a minute
      heroku-failed.heroku-cli-sni-test.com Failed uh oh something failed less than a minute

      === Some domains failed validation after multiple attempts, retry by running: heroku certs:auto:refresh
          See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
    `))
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  context('--wait', function () {
    let commandExecutedTime: string
    beforeEach(function () {
      commandExecutedTime = new Date().toISOString()
      // Freeze Date's now() time so when date-fns compares it will be
      // immediately after the command is executed.
      const now = Date.now()
      sandbox.stub(Date, 'now').returns(now)
    })

    afterEach(function () {
      sandbox.restore()
    })

    it('waits until certs are issued and displays the domains details', async function () {
      const now = commandExecutedTime
      api
        .get('/apps/example')
        .reply(200, {acm: true})
        .get('/apps/example/sni-endpoints')
        .reply(200, [])
        .get('/apps/example/domains')
        .reply(200, [{
          acm_status: null,
          cname: null,
          hostname: 'tokyo-1050.herokuapp.com',
          kind: 'heroku',
        }, {
          acm_status: 'cert issued',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }, {
          acm_status: 'failing',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          acm_status: null,
          cname: null,
          hostname: 'tokyo-1050.herokuapp.com',
          kind: 'heroku',
        }, {
          acm_status: 'cert issued',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }, {
          acm_status: 'failing',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          acm_status: null,
          cname: null,
          hostname: 'tokyo-1050.herokuapp.com',
          kind: 'heroku',
        }, {
          acm_status: 'cert issued',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }, {
          acm_status: 'cert issued',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          acm_status: null,
          cname: null,
          hostname: 'tokyo-1050.herokuapp.com',
          kind: 'heroku',
        }, {
          acm_status: 'cert issued',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }, {
          acm_status: 'cert issued',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }])

      await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ])

      expect(stderr.output).to.equal(heredoc`
        Waiting until the certificate is issued to all domains... done
      `)
      expect(stdout.output).to.include('=== Automatic Certificate Management is enabled on ⬢ example')
      const expectedHeader = removeAllWhitespace('Domain                                 Status      Last Updated')
      const expected = removeAllWhitespace(heredoc(`
        heroku-acm.heroku-cli-sni-test.com     Cert issued less than a minute
        heroku-failing.heroku-cli-sni-test.com Cert issued less than a minute
      `))
      const actual = removeAllWhitespace(stdout.output)
      expect(actual).to.include(expectedHeader)
      expect(actual).to.include(expected)
    })

    it('waits until certs are issued or failed and displays the domains details ignoring errors while waiting', async function () {
      const now = new Date().toISOString()
      api
        .get('/apps/example')
        .reply(200, {acm: true})
        .get('/apps/example/sni-endpoints')
        .reply(200, [])
        .get('/apps/example/domains')
        .reply(200, [{
          acm_status: null,
          cname: null,
          hostname: 'tokyo-1050.herokuapp.com',
          kind: 'heroku',
        }, {
          acm_status: 'cert issued',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }, {
          acm_status: 'failing',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          acm_status: null,
          cname: null,
          hostname: 'tokyo-1050.herokuapp.com',
          kind: 'heroku',
        }, {
          acm_status: 'cert issued',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }, {
          acm_status: 'failing',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          acm_status: null,
          cname: null,
          hostname: 'tokyo-1050.herokuapp.com',
          kind: 'heroku',
        }, {
          acm_status: 'cert issued',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }, {
          acm_status: 'failed',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }])
        .get('/apps/example/domains')
        .reply(200, [{
          acm_status: null,
          cname: null,
          hostname: 'tokyo-1050.herokuapp.com',
          kind: 'heroku',
        }, {
          acm_status: 'cert issued',
          cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-acm.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }, {
          acm_status: 'failed',
          cname: 'heroku-failed.heroku-cli-sni-test.com.herokudns.com',
          hostname: 'heroku-failing.heroku-cli-sni-test.com',
          kind: 'custom',
          updated_at: now,
        }])

      await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ])

      expect(stderr.output).to.equal(heredoc`
        Waiting until the certificate is issued to all domains... !
      `)
      expect(stdout.output).to.include('=== Automatic Certificate Management is enabled on ⬢ example')
      const actual = removeAllWhitespace(stdout.output)
      const expectedHeader = removeAllWhitespace('Domain                                 Status      Last Updated')
      const expected = removeAllWhitespace(heredoc(`
        heroku-acm.heroku-cli-sni-test.com     Cert issued less than a minute
        heroku-failing.heroku-cli-sni-test.com Failed      less than a minute

        === Some domains failed validation after multiple attempts, retry by running: heroku certs:auto:refresh
            See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons\n
      `))
      expect(actual).to.include(expectedHeader)
      expect(actual).to.include(expected)
    })
  })
})
