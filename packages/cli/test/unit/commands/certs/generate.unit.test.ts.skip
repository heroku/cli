import Cmd from '../../../../src/commands/certs/generate.js'
import {stdout, stderr} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand.js'
import nock from 'nock'
import {endpoint} from '../../../helpers/stubs/sni-endpoints.js'
import * as sinon from 'sinon'

import {expect} from '@oclif/test'
import {SinonStub} from 'sinon'

describe('heroku certs:generate', function () {
  let promptForOwnerInfoStub: SinonStub
  let spawnOpenSSLStub: SinonStub

  beforeEach(function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    promptForOwnerInfoStub = sinon.stub(Cmd.prototype, 'promptForOwnerInfo')
    promptForOwnerInfoStub.returns(Promise.resolve({}))

    spawnOpenSSLStub = sinon.stub(Cmd.prototype as any, 'spawnOpenSSL')
    spawnOpenSSLStub.resolves(0)
  })

  afterEach(function () {
    promptForOwnerInfoStub.restore()
    spawnOpenSSLStub.restore()
  })

  it('# with certificate prompts emitted if no parts of subject provided', async function () {
    promptForOwnerInfoStub.returns(Promise.resolve({owner: 'Heroku', country: 'US', area: 'California', city: 'San Francisco'}))

    await runCommand(Cmd, [
      '--app',
      'example',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.true
    expect(stdout.output).to.equal('')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/C=US/ST=California/L=San Francisco/O=Heroku/CN=example.com'])).to.be.true
  })

  it('# not emitted if any part of subject is specified', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--owner',
      'Heroku',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/O=Heroku/CN=example.com'])).to.be.true
  })

  it('# not emitted if --now is specified', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/CN=example.com'])).to.be.true
  })

  it('# not emitted if --subject is specified', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--subject',
      'SOMETHING',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', 'SOMETHING'])).to.be.true
  })

  it('# without --selfsigned does not request a self-signed certificate', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.com.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:add CERTFILE example.com.key\n')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/CN=example.com'])).to.be.true
  })

  it('# with --selfsigned does request a self-signed certificate', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      '--selfsigned',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('Your key and self-signed certificate have been generated.\nNext, run:\n$ heroku certs:add example.com.crt example.com.key\n')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.crt', '-subj', '/CN=example.com', '-x509'])).to.be.true
  })

  it('# suggests next step should be certs:update when domain is known in sni', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.org',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.org.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:update CERTFILE example.org.key\n')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])).to.be.true
  })

  it('# suggests next step should be certs:update when domain is known in ssl', async function () {
    nock.cleanAll()
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.org',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.org.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:add CERTFILE example.org.key\n')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])).to.be.true
  })

  it('# key size can be changed using keysize', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      '--keysize',
      '4096',
      'example.org',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.org.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:update CERTFILE example.org.key\n')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:4096', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])).to.be.true
  })
})
