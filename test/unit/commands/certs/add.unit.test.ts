import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {CreateAndAssociateOptions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core'
import {expect} from 'chai'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/certs/add.js'
import {CertAndKeyManager} from '../../../../src/lib/certs/get-cert-and-key.js'
import {sniEndpointA} from '../../../fixtures/certs/fixtures.js'
import {expectJsonError, expectJsonSnapshot} from '../../../helpers/json-snapshot.js'
import {
  certificateDetails,
  endpoint,
  endpointStables,
} from '../../../helpers/stubs/sni-endpoints.js'

const heredoc = tsheredoc

type FakePlatform = {
  sniEndpoint: {createAndAssociate: SinonStub, matchCertificateDomains: SinonStub},
}

function buildFakePlatform(): FakePlatform {
  return {
    sniEndpoint: {createAndAssociate: sinon.stub(), matchCertificateDomains: sinon.stub()},
  }
}

describe('heroku certs:add', function () {
  let fakePlatform: FakePlatform
  let stubbedSelectDomainsReturnValue: {domains: string[]} = {domains: []}
  let stubbedSelectDomains: SinonStub
  let stubbedGetCertAndKey: SinonStub

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    stubbedSelectDomains = sinon.stub(Cmd.prototype, 'selectDomains')
    stubbedSelectDomains.callsFake(async () => stubbedSelectDomainsReturnValue)
    stubbedGetCertAndKey = sinon.stub(CertAndKeyManager.prototype, 'getCertAndKey')
    stubbedGetCertAndKey.resolves({
      crt: Buffer.from('pem content'),
      key: Buffer.from('key content'),
    })
  })

  afterEach(function () {
    sinon.restore()
    stubbedSelectDomainsReturnValue = {domains: []}
  })

  it('# works with a cert and key', async function () {
    fakePlatform.sniEndpoint.createAndAssociate.resolves(endpoint)

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'key_file',
    ])

    expect(fakePlatform.sniEndpoint.createAndAssociate.calledOnce).to.equal(true)
    const {args} = fakePlatform.sniEndpoint.createAndAssociate.firstCall
    expect(args[0]).to.equal('example')
    expect(args[1]).to.equal('pem content')
    expect(args[2]).to.equal('key content')
    expect(args[3]).to.have.property('resolveDomains').that.is.a('function')
    expect(stderr).to.contain('Adding SSL certificate to ⬢ example... done\n')
    expect(stdout).to.equal(`Certificate details:\n${heredoc(certificateDetails)}`)
  })

  it('# resolveDomains callback drives the prompt and selectDomains', async function () {
    stubbedSelectDomainsReturnValue = {domains: ['biz.example.com']}
    fakePlatform.sniEndpoint.createAndAssociate.callsFake(async (_app, _crt, _key, opts) => {
      await opts.resolveDomains(['biz.example.com'])
      return endpointStables
    })

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'key_file',
    ])

    expect(stubbedSelectDomains.calledOnce).to.equal(true)
    expect(stubbedSelectDomains.firstCall.args[0]).to.eql(['biz.example.com'])
    expect(stderr).to.contain('Adding SSL certificate to ⬢ example... done\n')
    expect(stdout).to.contain('=== Almost done! Which of these domains on this application would you like this certificate associated with?')
  })

  it('# stops the action spinner before the domain prompt renders', async function () {
    // Stub `start` to a no-op so the only recorded `stop` calls are the ones
    // the command makes explicitly (ux.action.start internally calls stop to
    // clear any prior action, which would otherwise pollute the count).
    sinon.stub(ux.action, 'start')
    const uxActionStop = sinon.stub(ux.action, 'stop')
    let stopCallCountWhenPrompted = -1
    stubbedSelectDomains.callsFake(async () => {
      stopCallCountWhenPrompted = uxActionStop.callCount
      return stubbedSelectDomainsReturnValue
    })
    fakePlatform.sniEndpoint.createAndAssociate.callsFake(async (_app, _crt, _key, opts) => {
      await opts.resolveDomains(['biz.example.com'])
      return endpointStables
    })

    await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'key_file',
    ])

    expect(stubbedSelectDomains.calledOnce).to.equal(true)
    expect(uxActionStop.calledBefore(stubbedSelectDomains)).to.equal(true)
    expect(stopCallCountWhenPrompted).to.be.at.least(1)
  })

  it('# stops the action spinner even when the SDK resolves without invoking the callback', async function () {
    sinon.stub(ux.action, 'start')
    const uxActionStop = sinon.stub(ux.action, 'stop')
    fakePlatform.sniEndpoint.createAndAssociate.resolves(endpointStables)

    await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'key_file',
    ])

    expect(stubbedSelectDomains.called).to.equal(false)
    expect(uxActionStop.called).to.equal(true)
  })

  it('# stops the spinner with a failure marker (not "done") and surfaces the error when the SDK rejects', async function () {
    fakePlatform.sniEndpoint.createAndAssociate.rejects(new Error('boom'))

    const {error, stderr} = await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'key_file',
    ])

    expect(error).to.be.an('error')
    expect(error?.message).to.equal('boom')
    // The failed create must not print a success spinner before the error.
    expect(stderr).to.not.contain('Adding SSL certificate to ⬢ example... done')
    expect(stderr).to.contain('Adding SSL certificate to ⬢ example... !')
  })

  it('# says how to remove the certificate when it was uploaded but associating domains failed', async function () {
    fakePlatform.sniEndpoint.createAndAssociate.rejects(Object.assign(
      new Error('The certificate was uploaded to example as tokyo-1050, but associating it with domains failed: Timed out.'),
      {name: 'SniEndpointAssociationError', sniEndpoint: endpoint},
    ))

    const {error} = await runCommand(Cmd, ['--app', 'example', '--domains', 'www.example.com', 'pem_file', 'key_file'])

    expect(error?.message).to.equal(heredoc`
      The certificate was uploaded to example as tokyo-1050, but associating it with domains failed: Timed out.
      To remove it, run heroku certs:remove --app example --name tokyo-1050.
    `.trimEnd())
  })

  it('# does not prompt when the SDK resolves without invoking the callback', async function () {
    fakePlatform.sniEndpoint.createAndAssociate.resolves(endpointStables)

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'key_file',
    ])

    expect(stubbedSelectDomains.called).to.equal(false)
    expect(stderr).to.contain('Adding SSL certificate to ⬢ example... done\n')
    expect(stdout).to.contain('Certificate details:')
    expect(stdout).to.contain('Common Name(s): foo.example.org')
  })

  it('# waits for domains to be ready', async function () {
    fakePlatform.sniEndpoint.createAndAssociate.callsFake(async (_app: string, _crt: string, _key: string, opts: CreateAndAssociateOptions) => {
      opts?.domainPoller?.onStart?.()
      opts?.domainPoller?.onStop?.()
      return endpointStables
    })

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'key_file',
    ])

    const addingIndex = stderr.indexOf('Adding SSL certificate to ⬢ example... done')
    const waitingIndex = stderr.indexOf('Waiting for stable domains to be created... done')
    expect(addingIndex).to.be.greaterThan(-1)
    expect(waitingIndex).to.be.greaterThan(addingIndex)
  })

  describe('--domains', function () {
    it('associates the named domains without prompting', async function () {
      fakePlatform.sniEndpoint.createAndAssociate.resolves(endpointStables)

      const {stderr} = await runCommand(Cmd, ['--app', 'example', '--domains', 'www.example.com, api.example.com', 'pem_file', 'key_file'])

      const options = fakePlatform.sniEndpoint.createAndAssociate.firstCall.args[3]
      expect(options.domains).to.deep.equal(['www.example.com', 'api.example.com'])
      expect(options).to.not.have.property('resolveDomains')
      expect(options.domainPoller).to.be.an('object')
      expect(stubbedSelectDomains.called).to.equal(false)
      expect(fakePlatform.sniEndpoint.matchCertificateDomains.called).to.equal(false)
      expect(stderr).to.contain('Adding SSL certificate to ⬢ example... done')
    })

    it('associates none with an empty value', async function () {
      fakePlatform.sniEndpoint.createAndAssociate.resolves(endpointStables)

      await runCommand(Cmd, ['--app', 'example', '--domains', '', 'pem_file', 'key_file'])

      expect(fakePlatform.sniEndpoint.createAndAssociate.firstCall.args[3].domains).to.deep.equal([])
      expect(stubbedSelectDomains.called).to.equal(false)
    })

    it('stops the spinner with a failure marker when the SDK rejects the domains', async function () {
      fakePlatform.sniEndpoint.createAndAssociate.rejects(new Error('Can\'t associate the certificate: nope.example.com isn\'t a domain on example. Nothing was uploaded.'))

      const {error, stderr} = await runCommand(Cmd, ['--app', 'example', '--domains', 'nope.example.com', 'pem_file', 'key_file'])

      expect(error?.message).to.contain('nope.example.com isn\'t a domain on example')
      expect(stderr).to.contain('Adding SSL certificate to ⬢ example... !')
    })
  })

  describe('--json', function () {
    it('returns the created certificate when it covers none of the app\'s domains', async function () {
      fakePlatform.sniEndpoint.matchCertificateDomains.resolves([])
      fakePlatform.sniEndpoint.createAndAssociate.resolves(sniEndpointA)

      await expectJsonSnapshot(this, Cmd, ['--app', 'example', 'pem_file', 'key_file'])

      expect(fakePlatform.sniEndpoint.matchCertificateDomains.alwaysCalledWithExactly('example', 'pem content')).to.equal(true)
      for (const call of fakePlatform.sniEndpoint.createAndAssociate.getCalls()) {
        expect(call.args[3].domains).to.deep.equal([])
        expect(call.args[3]).to.not.have.property('resolveDomains')
      }

      expect(stubbedSelectDomains.called).to.equal(false)
    })

    it('fails before upload, naming --domains, when the certificate covers app domains', async function () {
      fakePlatform.sniEndpoint.matchCertificateDomains.resolves(['www.example.com', 'api.example.com'])

      await expectJsonError(
        Cmd,
        ['--app', 'example', 'pem_file', 'key_file'],
        'This certificate covers www.example.com, api.example.com on example. Pass --domains with the hostnames to associate, or --domains \'\' to associate none. '
        + 'Commands don\'t prompt for domains with --json. Nothing was uploaded.',
      )

      expect(fakePlatform.sniEndpoint.createAndAssociate.called).to.equal(false)
      expect(stubbedSelectDomains.called).to.equal(false)
    })

    it('returns the endpoint the SDK re-fetched after associating --domains', async function () {
      fakePlatform.sniEndpoint.createAndAssociate.resolves(sniEndpointA)

      const {json} = await expectJsonSnapshot<typeof sniEndpointA>(this, Cmd, ['--app', 'example', '--domains', 'www.example.com', 'pem_file', 'key_file'])

      expect(json.domains).to.deep.equal(sniEndpointA.domains)
      expect(fakePlatform.sniEndpoint.matchCertificateDomains.called).to.equal(false)
      expect(fakePlatform.sniEndpoint.createAndAssociate.firstCall.args[3].domains).to.deep.equal(['www.example.com'])
    })
  })
})
