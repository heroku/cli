import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import net from 'node:net'
import sinon from 'sinon'

import PsForward from '../../../../src/commands/ps/forward.js'
import {HerokuExec} from '../../../../src/lib/ps-exec/exec.js'

function createMockServerWithSetup(portsCount = 1) {
  let setupComplete: () => void
  const setupPromise = new Promise<void>(resolve => {
    setupComplete = resolve
  })

  let setupCount = 0
  const mockServer = {
    listen: sinon.stub(),
  }

  mockServer.listen.callsFake(() => {
    setupCount++
    if (setupCount === portsCount) {
      setupComplete()
    }

    return mockServer
  })

  return {mockServer, setupPromise}
}

describe('ps:forward', function () {
  let herokuExecInitFeatureStub: sinon.SinonStub
  let herokuExecCreateSocksProxyStub: sinon.SinonStub
  let netCreateServerStub: sinon.SinonStub

  beforeEach(function () {
    herokuExecInitFeatureStub = sinon.stub(HerokuExec.prototype, 'initFeature')
    herokuExecCreateSocksProxyStub = sinon.stub(HerokuExec.prototype, 'createSocksProxy')
    netCreateServerStub = sinon.stub(net, 'createServer')
  })

  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
  })

  it('forwards traffic on a local port to a dyno', async function () {
    const {mockServer, setupPromise} = createMockServerWithSetup()
    netCreateServerStub.returns(mockServer as any)

    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecCreateSocksProxyStub.callsFake((context, heroku, configVars, callback) => {
      callback('10.0.0.1', 'web.1', 1080)
    })

    // Start the command but don't wait for it to complete (it runs forever)
    const commandPromise = runCommand(PsForward, [
      '8080',
      '--app',
      'myapp',
    ])

    // Wait for setup to complete
    await setupPromise
    // Give event loop time to register SIGINT listener
    await new Promise(resolve => setImmediate(resolve))

    expect(herokuExecInitFeatureStub.calledOnce).to.be.true
    expect(herokuExecCreateSocksProxyStub.calledOnce).to.be.true
    expect(netCreateServerStub.calledOnce).to.be.true
    expect(mockServer.listen.calledWith(8080)).to.be.true

    // Send SIGINT to stop the command
    process.emit('SIGINT', 'SIGINT')
    await commandPromise
  })

  it('forwards multiple ports when comma-separated list is provided', async function () {
    const {mockServer, setupPromise} = createMockServerWithSetup(2)
    netCreateServerStub.returns(mockServer as any)

    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecCreateSocksProxyStub.callsFake((context, heroku, configVars, callback) => {
      callback('10.0.0.1', 'web.1', 1080)
    })

    const commandPromise = runCommand(PsForward, [
      '8080,9000',
      '--app',
      'myapp',
    ])

    await setupPromise
    // Give event loop time to register SIGINT listener
    await new Promise(resolve => setImmediate(resolve))

    expect(netCreateServerStub.callCount).to.equal(2)
    expect(mockServer.listen.calledWith(8080)).to.be.true
    expect(mockServer.listen.calledWith(9000)).to.be.true

    process.emit('SIGINT', 'SIGINT')
    await commandPromise
  })

  it('forwards ports with different local and remote ports', async function () {
    const {mockServer, setupPromise} = createMockServerWithSetup()
    netCreateServerStub.returns(mockServer as any)

    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecCreateSocksProxyStub.callsFake((context, heroku, configVars, callback) => {
      callback('10.0.0.1', 'web.1', 1080)
    })

    const commandPromise = runCommand(PsForward, [
      '--app',
      'myapp',
      '8080:9000',
    ])

    await setupPromise
    // Give event loop time to register SIGINT listener
    await new Promise(resolve => setImmediate(resolve))

    expect(mockServer.listen.calledWith(8080)).to.be.true

    process.emit('SIGINT', 'SIGINT')
    await commandPromise
  })

  it('uses custom dyno when --dyno is specified', async function () {
    const {mockServer, setupPromise} = createMockServerWithSetup()
    netCreateServerStub.returns(mockServer as any)

    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecCreateSocksProxyStub.callsFake((context, heroku, configVars, callback) => {
      callback('10.0.0.1', 'worker.1', 1080)
    })

    const commandPromise = runCommand(PsForward, [
      '--app',
      'myapp',
      '--dyno',
      'worker.1',
      '8080',
    ])

    await setupPromise
    // Give event loop time to register SIGINT listener
    await new Promise(resolve => setImmediate(resolve))

    const initFeatureContext = herokuExecInitFeatureStub.firstCall.args[0]
    expect(initFeatureContext.flags.dyno).to.equal('worker.1')

    process.emit('SIGINT', 'SIGINT')
    await commandPromise
  })

  it('passes "forward" command to initFeature', async function () {
    const {mockServer, setupPromise} = createMockServerWithSetup()
    netCreateServerStub.returns(mockServer as any)

    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback, command) => {
      expect(command).to.equal('forward')
      await callback({})
    })

    herokuExecCreateSocksProxyStub.callsFake((context, heroku, configVars, callback) => {
      callback('10.0.0.1', 'web.1', 1080)
    })

    const commandPromise = runCommand(PsForward, [
      '--app',
      'myapp',
      '8080',
    ])

    await setupPromise
    // Give event loop time to register SIGINT listener
    await new Promise(resolve => setImmediate(resolve))

    expect(herokuExecInitFeatureStub.firstCall.args[3]).to.equal('forward')

    process.emit('SIGINT', 'SIGINT')
    await commandPromise
  })
})
