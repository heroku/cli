import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/certs/add.js'
import {CertAndKeyManager} from '../../../../src/lib/certs/get-cert-and-key.js'
import {
  certificateDetails,
  endpoint,
  endpointStables,
} from '../../../helpers/stubs/sni-endpoints.js'

const heredoc = tsheredoc.default

type FakePlatform = {
  sniEndpoint: {createAndAssociate: SinonStub},
}

function buildFakePlatform(): FakePlatform {
  return {
    sniEndpoint: {createAndAssociate: sinon.stub()},
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
})
