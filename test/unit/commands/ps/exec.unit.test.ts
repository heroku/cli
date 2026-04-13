import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import PsExec from '../../../../src/commands/ps/exec.js'
import {HerokuExec} from '../../../../src/lib/ps-exec/exec.js'
import {HerokuSsh} from '../../../../src/lib/ps-exec/ssh.js'

describe('ps:exec', function () {
  let herokuExecInitFeatureStub: sinon.SinonStub
  let herokuExecUpdateClientKeyStub: sinon.SinonStub
  let herokuExecCheckStatusStub: sinon.SinonStub
  let herokuSshConnectStub: sinon.SinonStub
  let herokuSshSshStub: sinon.SinonStub

  beforeEach(function () {
    herokuExecInitFeatureStub = sinon.stub(HerokuExec.prototype, 'initFeature')
    herokuExecUpdateClientKeyStub = sinon.stub(HerokuExec.prototype, 'updateClientKey')
    herokuExecCheckStatusStub = sinon.stub(HerokuExec.prototype, 'checkStatus')
    herokuSshConnectStub = sinon.stub(HerokuSsh.prototype, 'connect')
    herokuSshSshStub = sinon.stub(HerokuSsh.prototype, 'ssh')
  })

  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
  })

  it('creates an SSH session to a dyno', async function () {
    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecUpdateClientKeyStub.callsFake(async (context, heroku, configVars, callback) => {
      const mockResponse = {
        body: JSON.stringify({
          client_user: 'user123',
          proxy_public_key: 'ssh-rsa AAAA...',
          tunnel_host: 'tunnel.example.com',
        }),
      }
      callback('mock-private-key', 'web.1', mockResponse)
    })

    herokuSshConnectStub.resolves()

    const {stderr} = await runCommand(PsExec, [
      '--app',
      'myapp',
    ])

    expect(herokuExecInitFeatureStub.calledOnce).to.be.true
    expect(herokuExecUpdateClientKeyStub.calledOnce).to.be.true
    expect(herokuSshConnectStub.calledOnce).to.be.true
    expect(ansis.strip(stderr)).to.include('Connecting to web.1 on ⬢ myapp')
  })

  it('uses custom dyno when --dyno is specified', async function () {
    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecUpdateClientKeyStub.callsFake(async (context, heroku, configVars, callback) => {
      const mockResponse = {
        body: JSON.stringify({
          client_user: 'user123',
          proxy_public_key: 'ssh-rsa AAAA...',
          tunnel_host: 'tunnel.example.com',
        }),
      }
      callback('mock-private-key', 'worker.1', mockResponse)
    })

    herokuSshConnectStub.resolves()

    await runCommand(PsExec, [
      '--app',
      'myapp',
      '--dyno',
      'worker.1',
    ])

    const initFeatureContext = herokuExecInitFeatureStub.firstCall.args[0]
    expect(initFeatureContext.flags.dyno).to.equal('worker.1')
  })

  it('uses native ssh when --ssh flag is specified', async function () {
    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecUpdateClientKeyStub.callsFake(async (context, heroku, configVars, callback) => {
      const mockResponse = {
        body: JSON.stringify({
          client_user: 'user123',
          proxy_public_key: 'ssh-rsa AAAA...',
          tunnel_host: 'tunnel.example.com',
        }),
      }
      callback('mock-private-key', 'web.1', mockResponse)
    })

    herokuSshSshStub.resolves()

    await runCommand(PsExec, [
      '--app',
      'myapp',
      '--ssh',
    ])

    expect(herokuSshSshStub.calledOnce).to.be.true
    expect(herokuSshConnectStub.called).to.be.false
  })

  it('checks status when --status flag is specified', async function () {
    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecCheckStatusStub.resolves()

    await runCommand(PsExec, [
      '--app',
      'myapp',
      '--status',
    ])

    expect(herokuExecCheckStatusStub.calledOnce).to.be.true
    expect(herokuExecUpdateClientKeyStub.called).to.be.false
  })

  it('passes variable args to the SSH session', async function () {
    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecUpdateClientKeyStub.callsFake(async (context, heroku, configVars, callback) => {
      const mockResponse = {
        body: JSON.stringify({
          client_user: 'user123',
          proxy_public_key: 'ssh-rsa AAAA...',
          tunnel_host: 'tunnel.example.com',
        }),
      }
      callback('mock-private-key', 'web.1', mockResponse)
    })

    herokuSshConnectStub.resolves()

    await runCommand(PsExec, [
      '--app',
      'myapp',
      '--',
      'node',
      '-i',
    ])

    expect(herokuExecInitFeatureStub.called).to.be.true
    const initFeatureContext = herokuExecInitFeatureStub.firstCall.args[0]
    expect(initFeatureContext.args).to.deep.equal(['node', '-i'])
  })

  it('passes "exec" command to initFeature', async function () {
    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback, command) => {
      expect(command).to.equal('exec')
      await callback({})
    })

    herokuExecUpdateClientKeyStub.callsFake(async (context, heroku, configVars, callback) => {
      const mockResponse = {
        body: JSON.stringify({
          client_user: 'user123',
          proxy_public_key: 'ssh-rsa AAAA...',
          tunnel_host: 'tunnel.example.com',
        }),
      }
      callback('mock-private-key', 'web.1', mockResponse)
    })

    herokuSshConnectStub.resolves()

    await runCommand(PsExec, [
      '--app',
      'myapp',
    ])

    expect(herokuExecInitFeatureStub.firstCall.args[3]).to.equal('exec')
  })
})
