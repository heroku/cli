import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/certs/info.js'
import {SniEndpoint} from '../../../../src/lib/types/sni-endpoint.js'
import {
  certificateDetails,
  certificateDetailsWithDomains,
  endpoint,
  endpointTrusted,
  endpointUntrusted,
  endpointWithDomains,
  untrustedCertificateDetails,
} from '../../../helpers/stubs/sni-endpoints.js'
import * as sharedSni from './shared-sni.unit.test.js'

const heredoc = tsheredoc.default

type FakePlatform = {
  domain: {info: SinonStub},
  sniEndpoint: {info: SinonStub, list: SinonStub},
}

function buildFakePlatform(): FakePlatform {
  return {
    domain: {info: sinon.stub()},
    sniEndpoint: {info: sinon.stub(), list: sinon.stub()},
  }
}

describe('heroku certs:info', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows certificate details when self-signed', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpoint])
    fakePlatform.sniEndpoint.info.resolves(structuredClone(endpoint))
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])
    expect(fakePlatform.sniEndpoint.info.calledOnceWithExactly('example', 'tokyo-1050')).to.equal(true)
    expectOutput(stderr, heredoc(`
      Fetching SSL certificate tokyo-1050 info for ⬢ example... done
    `))
    expectOutput(stdout, heredoc(`
      Certificate details:
      ${certificateDetails}
    `))
  })

  it('returns domains when show-domains flag is passed', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpointWithDomains])
    fakePlatform.sniEndpoint.info.resolves(structuredClone(endpointWithDomains))
    fakePlatform.domain.info.withArgs('example', 'tokyo-1050.herokussl.com').resolves({
      cname: 'example.herokudns.com',
      hostname: 'subdomain.example.com',
      kind: 'custom',
      status: 'pending',
    })
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--show-domains',
    ])
    expectOutput(stdout, heredoc(`
      Certificate details:
      ${certificateDetailsWithDomains}
    `))
  })

  it('shows certificate details when not trusted', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpoint])
    fakePlatform.sniEndpoint.info.resolves(structuredClone(endpointUntrusted))
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr, heredoc(`
      Fetching SSL certificate tokyo-1050 info for ⬢ example... done
    `))
    expectOutput(heredoc(stdout), heredoc(`
      Certificate details:
      ${untrustedCertificateDetails}
    `))
  })

  it('shows certificate details when trusted', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpoint])
    fakePlatform.sniEndpoint.info.resolves(structuredClone(endpointTrusted))
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr, heredoc(`
      Fetching SSL certificate tokyo-1050 info for ⬢ example... done
    `))
    expectOutput(stdout, heredoc(`
      Certificate details:
      Common Name(s): example.org
      Expires At:     2013-08-01 21:34 UTC
      Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
      Starts At:      2012-08-01 21:34 UTC
      Subject:        /C=US/ST=California/L=San Francisco/O=Trusted/CN=trusted.example.org
      SSL certificate is verified by a root authority.
    `))
  })
})

describe('heroku shared', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    fakePlatform.sniEndpoint.info.resolves(structuredClone(endpoint))
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  const stderr = function (endpoint: Partial<SniEndpoint>) {
    return heredoc(`
      Fetching SSL certificate ${endpoint.name} info for ⬢ example... done
    `)
  }

  const stdout = function (certDetails: string) {
    return `Certificate details:\n${heredoc(certDetails)}`
  }

  sharedSni.shouldHandleArgs('certs:info', Cmd, () => fakePlatform, {stderr, stdout})
})
