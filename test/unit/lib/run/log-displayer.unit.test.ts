import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import {displayLogs} from '../../../../src/lib/run/log-displayer.js'

describe('displayLogs', function () {
  let streamLogsStub: SinonStub

  beforeEach(function () {
    // displayLogs constructs `new HerokuSDK({extensions: [logSessionExtensions]})`
    // and calls `.platform.logSession.streamLogs(app, options)`. Stub the
    // extension factory's streamLogs method so we can assert on the args
    // without making any network calls.
    //
    // logSessionExtensions.factory(ctx) is invoked once per HerokuSDK
    // construction, returning {streamLogs: ...}. Wrap the factory so the
    // returned object's streamLogs is our stub.

    streamLogsStub = stub().returns((async function * () {/* no-op */})())
  })

  afterEach(function () {
    restore()
  })

  function patchExtension(stubFn: SinonStub) {
    // The SDK's logSessionExtensions is an object with a factory function.
    // Replace its factory to return {streamLogs: stubFn} when invoked,
    // bypassing the real SDK plumbing for this unit test.
    return import('@heroku/sdk/extensions/platform').then(mod => {
      stub(mod.logSessionExtensions, 'factory').returns({streamLogs: stubFn} as never)
    })
  }

  it('forwards command options as streamLogs options', async function () {
    await patchExtension(streamLogsStub)

    await displayLogs({
      app: 'my-app',
      dyno: 'web.1',
      lines: 50,
      source: 'app',
      tail: true,
      type: undefined,
    })

    expect(streamLogsStub.calledOnce).to.be.true
    expect(streamLogsStub.firstCall.args[0]).to.equal('my-app')
    const passedOptions = streamLogsStub.firstCall.args[1]
    expect(passedOptions.dyno).to.equal('web.1')
    expect(passedOptions.lines).to.equal(50)
    expect(passedOptions.source).to.equal('app')
    expect(passedOptions.tail).to.equal(true)
    expect(passedOptions.type).to.equal(undefined)
    expect(passedOptions.signal).to.be.an.instanceOf(AbortSignal)
    expect(passedOptions.onSessionCreated).to.be.a('function')
  })

  it('passes through optional fields as undefined when not provided', async function () {
    await patchExtension(streamLogsStub)

    await displayLogs({
      app: 'my-app',
      tail: false,
    })

    const passedOptions = streamLogsStub.firstCall.args[1]
    expect(passedOptions.dyno).to.equal(undefined)
    expect(passedOptions.lines).to.equal(undefined)
    expect(passedOptions.source).to.equal(undefined)
    expect(passedOptions.type).to.equal(undefined)
    expect(passedOptions.tail).to.equal(false)
  })

  it('swallows the rejection when the stream throws after abort', async function () {
    // Mimic streamLogs throwing an AbortError after the caller aborts.
    // displayLogs should resolve cleanly rather than re-throw.
    const abortAwareStub = stub().callsFake((_app: string, opts: {signal: AbortSignal}) => (async function * () {
      await new Promise<void>((resolve, reject) => {
        opts.signal.addEventListener('abort', () => {
          const err = new Error('aborted')
          err.name = 'AbortError'
          reject(err)
        }, {once: true})
      })
      yield ''
    })())

    await patchExtension(abortAwareStub)

    const displayPromise = displayLogs({app: 'my-app', tail: true})
    process.emit('SIGINT')

    await displayPromise
  })
})
