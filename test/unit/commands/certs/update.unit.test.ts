import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {Errors} from '@oclif/core'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/certs/update.js'
import {CertAndKeyManager} from '../../../../src/lib/certs/get-cert-and-key.js'
import {SniEndpoint} from '../../../../src/lib/types/sni-endpoint.js'
import {certificateDetails, endpoint} from '../../../helpers/stubs/sni-endpoints.js'
import * as sharedSni from './shared-sni.unit.test.js'

const heredoc = tsheredoc.default

type FakePlatform = {
  domain: {info: SinonStub},
  sniEndpoint: {list: SinonStub, update: SinonStub},
}

function buildFakePlatform(): FakePlatform {
  return {
    domain: {info: sinon.stub()},
    sniEndpoint: {list: sinon.stub(), update: sinon.stub()},
  }
}

describe('heroku certs:update', function () {
  let stubbedGetCertAndKey: SinonStub
  let fakePlatform: FakePlatform

  beforeEach(function () {
    stubbedGetCertAndKey = sinon.stub(CertAndKeyManager.prototype, 'getCertAndKey')
    stubbedGetCertAndKey.returns(Promise.resolve({
      crt: 'pem content',
      key: 'key content',
    }))

    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('# requires confirmation', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpoint])

    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'notexample',
      'pem_file',
      'key_file',
    ])

    expect(error).to.exist
    expect(ansis.strip(error!.message)).to.equal('Confirmation notexample did not match example. Aborted.')
    expect(fakePlatform.sniEndpoint.list.called).to.equal(true)
    expect(fakePlatform.sniEndpoint.update.called).to.equal(false)
    expect(stdout).to.equal('')
  })

  it('# errors out when args < 2', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
    ])

    expect(error).to.exist
    const {message, oclif} = error as Errors.CLIError
    expect(ansis.strip(message)).to.equal('Missing 1 required arg:\nKEY  absolute path of the key file on disk\nSee more help with --help')
    expect(oclif.exit).to.equal(2)
    expect(stdout).to.equal('')
  })

  it('# can run', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpoint])
    fakePlatform.sniEndpoint.update.resolves(endpoint)

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
      'pem_file',
      'key_file',
    ])

    expect(fakePlatform.sniEndpoint.update.calledOnceWithExactly('example', 'tokyo-1050', {
      certificate_chain: 'pem content', private_key: 'key content',
    })).to.equal(true)
    expect(stderr).to.equal(heredoc`
      Updating SSL certificate tokyo-1050 for ⬢ example... done
    `)
    expect(stdout).to.equal(`Updated certificate details:\n${heredoc(certificateDetails)}`)
  })

  it('# errors out with intermediaries', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'int_file',
      'key_file',
    ])

    expect(error).to.exist
    const {message, oclif} = error as Errors.CLIError
    expect(ansis.strip(message)).to.equal('Unexpected argument: key_file\nSee more help with --help')
    expect(oclif.exit).to.equal(2)
    expect(stdout).to.equal('')
  })
})

describe('shared', function () {
  let stubbedGetCertAndKey: SinonStub
  let fakePlatform: FakePlatform

  beforeEach(function () {
    stubbedGetCertAndKey = sinon.stub(CertAndKeyManager.prototype, 'getCertAndKey')
    stubbedGetCertAndKey.returns(Promise.resolve({
      crt: 'pem content',
      key: 'key content',
    }))

    fakePlatform = buildFakePlatform()
    fakePlatform.sniEndpoint.update.resolves(endpoint)
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  const stderr = function (endpoint: Partial<SniEndpoint>) {
    return heredoc`
      Updating SSL certificate ${endpoint.name} for ⬢ example... done\n
    `
  }

  const stdout = function (certificateDetails: string, _endpoint: Partial<SniEndpoint>) {
    return `Updated certificate details:\n${heredoc(certificateDetails)}\n`
  }

  sharedSni.shouldHandleArgs('certs:update', Cmd, () => fakePlatform, {
    args: ['pem_file', 'key_file'],
    flags: {confirm: 'example'},
    stderr,
    stdout,
  })
})
