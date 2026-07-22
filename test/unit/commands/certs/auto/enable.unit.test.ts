import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/certs/auto/enable.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc.default
const sandbox = sinon.createSandbox()

type FakePlatform = {
  app: {enableACM: SinonStub, waitForACMCertificates: SinonStub},
  domain: {list: SinonStub, wait: SinonStub},
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {enableACM: sinon.stub(), waitForACMCertificates: sinon.stub()},
    domain: {list: sinon.stub(), wait: sinon.stub()},
  }
}

describe('heroku certs:auto:enable', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
    sandbox.restore()
  })

  it('enables acm with domains', async function () {
    fakePlatform.app.enableACM.resolves({acm: true})
    fakePlatform.domain.list.resolves([
      {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
      {cname: 'foo.example.org.herokudns.com', hostname: 'foo.example.org', kind: 'custom'},
    ])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr).to.equal(heredoc`
      Enabling Automatic Certificate Management... starting. See status with heroku certs:auto or wait until active with heroku certs:auto --wait
    `)
    expect(stdout).to.equal('=== Your certificate will now be managed by Heroku. Check the status by running heroku certs:auto.\n\n')
  })

  it('enables acm with changed domains', async function () {
    fakePlatform.app.enableACM.resolves({acm: true})
    fakePlatform.domain.list.onFirstCall().resolves([
      {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
      {cname: 'haiku.not-stable-dns.heroku.com', hostname: 'foo.example.org', kind: 'custom'},
      {cname: 'bar.example.org.herokudns.com', hostname: 'bar.example.org', kind: 'custom'},
    ])
    fakePlatform.domain.list.onSecondCall().resolves([
      {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
      {cname: 'foo.example.org.herokudns.com', hostname: 'foo.example.org', kind: 'custom'},
      {cname: 'bar.example.org.herokudns.com', hostname: 'bar.example.org', kind: 'custom'},
      {cname: 'mis.example.org.herokudns.com', hostname: 'mis.example.org', kind: 'custom'},
    ])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr).to.equal(heredoc`
      Enabling Automatic Certificate Management... starting. See status with heroku certs:auto or wait until active with heroku certs:auto --wait
    `)
    expect(stdout).to.include("=== Your certificate will now be managed by Heroku. Check the status by running heroku certs:auto.  Update your application's DNS settings as follows")
    const actual = removeAllWhitespace(stdout)
    const expectedHeader = removeAllWhitespace('Domain          Record Type DNS Target')
    const expectedRow = removeAllWhitespace('foo.example.org CNAME foo.example.org.herokudns.com')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expectedRow)
  })

  it('enables acm with no domains', async function () {
    fakePlatform.app.enableACM.resolves({acm: true})
    fakePlatform.domain.list.resolves([])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(stderr).to.equal(heredoc`
      Enabling Automatic Certificate Management... starting. See status with heroku certs:auto or wait until active with heroku certs:auto --wait
    `)
    expect(stdout).to.equal('=== Your certificate will now be managed by Heroku. Check the status by running heroku certs:auto.  Add a custom domain to your app by running heroku domains:add <yourdomain.com>\n\n')
  })

  context('--wait', function () {
    it('waits until all certs are issued and notifies', async function () {
      const now = new Date().toISOString()
      const notifySpy = sandbox.stub(Cmd, 'notifier')
      fakePlatform.app.enableACM.resolves({acm: true})
      fakePlatform.app.waitForACMCertificates.resolves()
      fakePlatform.domain.list.onFirstCall().resolves([
        {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
        {cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-acm.heroku-cli-sni-test.com', kind: 'custom'},
        {cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-san-test.heroku-cli-sni-test.com', kind: 'custom'},
      ])
      fakePlatform.domain.list.onSecondCall().resolves([
        {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
        {
          acm_status: 'in-progress', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-acm.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
        {
          acm_status: 'in-progress', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-san-test.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
      ])
      fakePlatform.domain.list.onThirdCall().resolves([
        {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
        {
          acm_status: 'cert issued', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-acm.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
        {
          acm_status: 'cert issued', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-san-test.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
      ])

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ])

      expect(notifySpy.called).to.equal(true)
      expect(stderr).to.equal(heredoc`
        Enabling Automatic Certificate Management... starting.
        Waiting until the certificate is issued to all domains... done
      `)
      expect(stdout).to.equal('=== Your certificate will now be managed by Heroku. Check the status by running heroku certs:auto.\n\n')
      // The old HTTP-intercept test could not assert the SDK call sequence. This
      // guards against a missing extension silently dropping waitForACMCertificates.
      sinon.assert.callOrder(fakePlatform.domain.list, fakePlatform.app.enableACM, fakePlatform.app.waitForACMCertificates)
      expect(fakePlatform.app.waitForACMCertificates.calledOnceWithExactly('example')).to.equal(true)
    })

    it('waits until all certs are issued or failed and notifies', async function () {
      const now = new Date().toISOString()
      const notifySpy = sandbox.stub(Cmd, 'notifier')
      fakePlatform.app.enableACM.resolves({acm: true})
      fakePlatform.app.waitForACMCertificates.rejects(new Error('ACM not enabled for some domains'))
      fakePlatform.domain.list.onFirstCall().resolves([
        {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
        {cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-acm.heroku-cli-sni-test.com', kind: 'custom'},
        {cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-san-test.heroku-cli-sni-test.com', kind: 'custom'},
      ])
      fakePlatform.domain.list.onSecondCall().resolves([
        {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
        {
          acm_status: 'in-progress', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-acm.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
        {
          acm_status: 'in-progress', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-san-test.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
      ])

      const {error, stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ])

      expect(error).to.exist
      expect(error!.message).to.equal('ACM not enabled for some domains')
      expect(notifySpy.called).to.equal(true)
      expect(stderr).to.equal(heredoc`
        Enabling Automatic Certificate Management... starting.
        Waiting until the certificate is issued to all domains... !
      `)
      expect(stdout).to.equal('=== Error: The certificate could not be issued to all domains. See status with heroku certs:auto.\n\n')
    })

    it('waits until all certs are failed and notifies', async function () {
      const now = new Date().toISOString()
      const notifySpy = sandbox.stub(Cmd, 'notifier')
      fakePlatform.app.enableACM.resolves({acm: true})
      fakePlatform.app.waitForACMCertificates.rejects(new Error('ACM not enabled for some domains'))
      fakePlatform.domain.list.onFirstCall().resolves([
        {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
        {cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-acm.heroku-cli-sni-test.com', kind: 'custom'},
        {cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-san-test.heroku-cli-sni-test.com', kind: 'custom'},
      ])
      fakePlatform.domain.list.onSecondCall().resolves([
        {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
        {
          acm_status: 'in-progress', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-acm.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
        {
          acm_status: 'in-progress', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-san-test.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
      ])

      const {error, stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ])

      expect(error).to.exist
      expect(error!.message).to.equal('ACM not enabled for some domains')
      expect(notifySpy.called).to.equal(true)
      expect(stderr).to.equal(heredoc`
        Enabling Automatic Certificate Management... starting.
        Waiting until the certificate is issued to all domains... !
      `)
      expect(stdout).to.equal('=== Error: The certificate could not be issued to all domains. See status with heroku certs:auto.\n\n')
    })

    it('does not wait if all certs are issued when first checked', async function () {
      const now = new Date().toISOString()
      const notifySpy = sandbox.stub(Cmd, 'notifier')
      fakePlatform.app.enableACM.resolves({acm: true})
      fakePlatform.domain.list.onFirstCall().resolves([
        {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
        {cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-acm.heroku-cli-sni-test.com', kind: 'custom'},
        {cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-san-test.heroku-cli-sni-test.com', kind: 'custom'},
      ])
      fakePlatform.domain.list.onSecondCall().resolves([
        {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
        {
          acm_status: 'cert issued', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-acm.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
        {
          acm_status: 'cert issued', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-san-test.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
      ])
      fakePlatform.domain.list.onThirdCall().resolves([
        {cname: null, hostname: 'tokyo-1050.herokuapp.com', kind: 'heroku'},
        {
          acm_status: 'cert issued', cname: 'heroku-acm.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-acm.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
        {
          acm_status: 'cert issued', cname: 'heroku-san-test.heroku-cli-sni-test.com.herokudns.com', hostname: 'heroku-san-test.heroku-cli-sni-test.com', kind: 'custom', updated_at: now,
        },
      ])

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'example',
        '--wait',
      ])

      expect(notifySpy.called).to.equal(true)
      expect(stderr).to.equal(heredoc`
        Enabling Automatic Certificate Management... starting.
      `)
      expect(stdout).to.equal('=== Your certificate will now be managed by Heroku. Check the status by running heroku certs:auto.\n\n')
      // Pre-check found every custom domain terminal, so the SDK wait must be skipped entirely.
      expect(fakePlatform.app.waitForACMCertificates.called).to.equal(false)
    })
  })
})
