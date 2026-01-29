import ansis from 'ansis'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/certs/update.js'
import {CertAndKeyManager} from '../../../../src/lib/certs/get_cert_and_key.js'
import {SniEndpoint} from '../../../../src/lib/types/sni_endpoint.js'
import runCommand from '../../../helpers/runCommand.js'
import {certificateDetails, endpoint} from '../../../helpers/stubs/sni-endpoints.js'
import * as sharedSni from './shared_sni.unit.test.js'

const heredoc = tsheredoc.default

describe('heroku certs:update', function () {
  let stubbedGetCertAndKey: SinonStub

  beforeEach(function () {
    stubbedGetCertAndKey = sinon.stub(CertAndKeyManager.prototype, 'getCertAndKey')
    stubbedGetCertAndKey.returns(Promise.resolve({
      crt: 'pem content',
      key: 'key content',
    }))
  })

  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
  })

  it('# requires confirmation', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    try {
      await runCommand(Cmd, [
        '--app',
        'example',
        '--confirm',
        'notexample',
        'pem_file',
        'key_file',
      ])
    } catch (error) {
      const {message} = error as Error
      expect(ansis.strip(message)).to.equal('Confirmation notexample did not match example. Aborted.')
    }

    api.done()
    expect(stdout.output).to.equal('')
  })

  it('# errors out when args < 2', async function () {
    try {
      await runCommand(Cmd, [
        '--app',
        'example',
        'pem_file',
      ])
    } catch (error) {
      const {message, oclif} = error as Errors.CLIError
      expect(ansis.strip(message)).to.equal('Missing 1 required arg:\nKEY  absolute path of the key file on disk\nSee more help with --help')
      expect(oclif.exit).to.equal(2)
    }

    expect(stdout.output).to.equal('')
  })

  it('# can run', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])
      .patch('/apps/example/sni-endpoints/tokyo-1050', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpoint)

    await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
      'pem_file',
      'key_file',
    ])

    api.done()
    expect(stderr.output).to.equal(heredoc`
      Updating SSL certificate tokyo-1050 for ⬢ example... done
    `)
    expect(stdout.output).to.equal(`Updated certificate details:\n${heredoc(certificateDetails)}`)
  })

  it('# errors out with intermediaries', async function () {
    try {
      await runCommand(Cmd, [
        '--app',
        'example',
        'pem_file',
        'int_file',
        'key_file',
      ])
    } catch (error) {
      const {message, oclif} = error as Errors.CLIError
      expect(ansis.strip(message)).to.equal('Unexpected argument: key_file\nSee more help with --help')
      expect(oclif.exit).to.equal(2)
    }

    expect(stdout.output).to.equal('')
  })
})

describe('shared', function () {
  let stubbedGetCertAndKey: SinonStub

  beforeEach(function () {
    stubbedGetCertAndKey = sinon.stub(CertAndKeyManager.prototype, 'getCertAndKey')
    stubbedGetCertAndKey.returns(Promise.resolve({
      crt: 'pem content',
      key: 'key content',
    }))
  })

  afterEach(function () {
    stubbedGetCertAndKey.restore()
  })

  const callback = function (err: Error | null, path: string, endpoint: Partial<SniEndpoint>) {
    if (err)
      throw err

    return nock('https://api.heroku.com')
      .patch(path, {certificate_chain: 'pem content', private_key: 'key content'})
      .reply(200, endpoint)
  }

  const stderr = function (endpoint: Partial<SniEndpoint>) {
    return heredoc`
      Updating SSL certificate ${endpoint.name} for ⬢ example... done\n
    `
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stdout = function (certificateDetails: string, _endpoint: Partial<SniEndpoint>) {
    return `Updated certificate details:\n${heredoc(certificateDetails)}\n`
  }

  sharedSni.shouldHandleArgs('certs:update', Cmd, callback, {
    args: ['pem_file', 'key_file'],
    flags: {confirm: 'example'},
    stderr,
    stdout,
  })
})
