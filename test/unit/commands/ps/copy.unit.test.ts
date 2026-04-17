import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import fs from 'node:fs'
import {restore, SinonStub, stub} from 'sinon'

import PsCopy from '../../../../src/commands/ps/copy.js'
import {HerokuExec} from '../../../../src/lib/ps-exec/exec.js'
import {HerokuSsh} from '../../../../src/lib/ps-exec/ssh.js'

describe('ps:copy', function () {
  let fsExistsSyncStub: SinonStub
  let herokuExecInitFeatureStub: SinonStub
  let herokuExecUpdateClientKeyStub: SinonStub
  let herokuSshScpStub: SinonStub

  beforeEach(function () {
    fsExistsSyncStub = stub(fs, 'existsSync')
    herokuExecInitFeatureStub = stub(HerokuExec.prototype, 'initFeature')
    herokuExecUpdateClientKeyStub = stub(HerokuExec.prototype, 'updateClientKey')
    herokuSshScpStub = stub(HerokuSsh.prototype, 'scp')
  })

  afterEach(function () {
    restore()
    nock.cleanAll()
  })

  it('copies a file from a dyno to local filesystem', async function () {
    fsExistsSyncStub.returns(false)

    // Mock the initFeature to call the callback with configVars
    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    // Mock updateClientKey to call the callback with mock data
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

    herokuSshScpStub.resolves()

    const {stdout} = await runCommand(PsCopy, [
      '--app',
      'myapp',
      'remote-file.txt',
    ])

    expect(stdout).to.include('Copying remote-file.txt')
  })

  it('uses custom output filename when --output is specified', async function () {
    fsExistsSyncStub.returns(false)

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

    herokuSshScpStub.resolves()

    const {stdout} = await runCommand(PsCopy, [
      '--app',
      'myapp',
      '--output',
      'local-file.txt',
      'remote-file.txt',
    ])

    expect(stdout).to.include('Copying remote-file.txt to local-file.txt')
  })

  it('uses custom dyno when --dyno is specified', async function () {
    fsExistsSyncStub.returns(false)

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

    herokuSshScpStub.resolves()

    await runCommand(PsCopy, [
      '--app',
      'myapp',
      '--dyno',
      'worker.1',
      'remote-file.txt',
    ])

    // Verify initFeature was called with correct context including dyno flag
    const initFeatureContext = herokuExecInitFeatureStub.firstCall.args[0]
    expect(initFeatureContext.flags.dyno).to.equal('worker.1')
  })

  it('errors when local file already exists', async function () {
    fsExistsSyncStub.returns(true)

    const {error} = await runCommand(PsCopy, [
      'remote-file.txt',
      '--app',
      'myapp',
    ])

    expect(error?.message).to.contain('already exists')
  })

  it('uses basename of source file as default destination', async function () {
    fsExistsSyncStub.returns(false)

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

    herokuSshScpStub.resolves()

    await runCommand(PsCopy, [
      '--app',
      'myapp',
      '/path/to/remote-file.txt',
    ])

    // Verify scp destination is just the basename
    const scpArgs = herokuSshScpStub.firstCall.args
    expect(scpArgs[4]).to.equal('/path/to/remote-file.txt')
    expect(scpArgs[5]).to.equal('remote-file.txt')
  })

  it('passes "copy" command to initFeature', async function () {
    fsExistsSyncStub.returns(false)

    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback, command) => {
      expect(command).to.equal('copy')
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

    herokuSshScpStub.resolves()

    await runCommand(PsCopy, [
      '--app',
      'myapp',
      'remote-file.txt',
    ])

    // Verify the command parameter was passed
    expect(herokuExecInitFeatureStub.firstCall.args[3]).to.equal('copy')
  })

  it('displays action message when connecting to dyno', async function () {
    fsExistsSyncStub.returns(false)

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

    herokuSshScpStub.resolves()

    const {stderr} = await runCommand(PsCopy, [
      '--app',
      'myapp',
      'remote-file.txt',
    ])

    // The action.start message should appear in stderr
    expect(ansis.strip(stderr)).to.include('Connecting to web.1 on ⬢ myapp')
  })
})
