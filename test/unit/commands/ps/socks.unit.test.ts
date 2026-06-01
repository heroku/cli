import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'

import PsSocks from '../../../../src/commands/ps/socks.js'
import {HerokuExec} from '../../../../src/lib/ps-exec/exec.js'

function createSocksSetup() {
  let setupComplete: () => void
  const setupPromise = new Promise<void>(resolve => {
    setupComplete = resolve
  })

  return {
    setupPromise,
    triggerSetup: () => setupComplete(),
  }
}

describe('ps:socks', function () {
  let herokuExecInitFeatureStub: SinonStub
  let herokuExecCreateSocksProxyStub: SinonStub

  beforeEach(function () {
    herokuExecInitFeatureStub = stub(HerokuExec.prototype, 'initFeature')
    herokuExecCreateSocksProxyStub = stub(HerokuExec.prototype, 'createSocksProxy')
  })

  afterEach(function () {
    restore()
    nock.cleanAll()
  })

  it('launches a SOCKS proxy into a dyno', async function () {
    const {setupPromise, triggerSetup} = createSocksSetup()

    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecCreateSocksProxyStub.callsFake((context, heroku, configVars, callback) => {
      if (callback) {
        callback('10.0.0.1', 'web.1', 1080)
      }

      triggerSetup()
    })

    // Start the command but don't wait for it to complete (it runs forever)
    const commandPromise = runCommand(PsSocks, [
      '--app',
      'myapp',
    ])

    // Wait for setup to complete
    await setupPromise
    // Give event loop time to register SIGINT listener
    await new Promise(resolve => setImmediate(resolve))

    expect(herokuExecInitFeatureStub.calledOnce).to.be.true
    expect(herokuExecCreateSocksProxyStub.calledOnce).to.be.true

    // Send SIGINT to stop the command
    process.emit('SIGINT', 'SIGINT')
    await commandPromise
  })

  it('uses custom dyno when --dyno is specified', async function () {
    const {setupPromise, triggerSetup} = createSocksSetup()

    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecCreateSocksProxyStub.callsFake((context, heroku, configVars, callback) => {
      if (callback) {
        callback('10.0.0.1', 'worker.1', 1080)
      }

      triggerSetup()
    })

    const commandPromise = runCommand(PsSocks, [
      '--app',
      'myapp',
      '--dyno',
      'worker.1',
    ])

    await setupPromise
    // Give event loop time to register SIGINT listener
    await new Promise(resolve => setImmediate(resolve))

    const initFeatureContext = herokuExecInitFeatureStub.firstCall.args[0]
    expect(initFeatureContext.flags.dyno).to.equal('worker.1')

    process.emit('SIGINT', 'SIGINT')
    await commandPromise
  })

  it('passes "socks" command to initFeature', async function () {
    const {setupPromise, triggerSetup} = createSocksSetup()

    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback, command) => {
      expect(command).to.equal('socks')
      await callback({})
    })

    herokuExecCreateSocksProxyStub.callsFake((context, heroku, configVars, callback) => {
      if (callback) {
        callback('10.0.0.1', 'web.1', 1080)
      }

      triggerSetup()
    })

    const commandPromise = runCommand(PsSocks, [
      '--app',
      'myapp',
    ])

    await setupPromise
    // Give event loop time to register SIGINT listener
    await new Promise(resolve => setImmediate(resolve))

    expect(herokuExecInitFeatureStub.firstCall.args[3]).to.equal('socks')

    process.emit('SIGINT', 'SIGINT')
    await commandPromise
  })

  it('stops when SIGINT is received', async function () {
    const {setupPromise, triggerSetup} = createSocksSetup()

    herokuExecInitFeatureStub.callsFake(async (context, heroku, callback) => {
      await callback({})
    })

    herokuExecCreateSocksProxyStub.callsFake((context, heroku, configVars, callback) => {
      if (callback) {
        callback('10.0.0.1', 'web.1', 1080)
      }

      triggerSetup()
    })

    const commandPromise = runCommand(PsSocks, [
      '--app',
      'myapp',
    ])

    await setupPromise
    // Give event loop time to register SIGINT listener
    await new Promise(resolve => setImmediate(resolve))

    // Send SIGINT to stop the command
    process.emit('SIGINT', 'SIGINT')
    await commandPromise

    expect(herokuExecInitFeatureStub.calledOnce).to.be.true
    expect(herokuExecCreateSocksProxyStub.calledOnce).to.be.true
  })
})
