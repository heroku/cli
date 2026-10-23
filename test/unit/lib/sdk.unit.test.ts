import {APIClient, vars} from '@heroku-cli/command'
import {warn as oclifWarn} from '@oclif/core/errors'
import {expect} from 'chai'
import {readFileSync} from 'node:fs'
import {stub} from 'sinon'

import {
  apiClientOptions, createSDK, resetCliAbortSignal, sdkOptions, tokenFor,
} from '../../../src/lib/sdk.js'

// The User-Agent identity the helpers default onto every request. We pass the
// structured {name, version} option so it reaches the SDK's custom-host stream
// clients too; heroku-fetch assembles the final string. Built from the CLI
// package.json version the same way the implementation does, so the assertion
// tracks a version bump instead of hard-coding a number that rots.
const {version: cliVersion} = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')) as {version: string}
const expectedUserAgent = {name: 'heroku-cli', version: cliVersion}

/**
 * Unit coverage for the CLI's canonical SDK constructor. The two concerns worth
 * pinning down are (1) the lazy token provider's precedence/coercion and (2) the
 * option wiring — that `baseUrl` lands on the platform service only and that
 * caller overrides win. The pure `*Options` builders let us assert the wiring
 * without constructing a real client or touching the network.
 */
describe('lib/sdk', function () {
  const fakeHeroku = (token?: string, account = 'user@example.com') =>
    ({getAuthEntry: stub().resolves(token === undefined ? undefined : {account, token})}) as unknown as APIClient

  describe('tokenFor', function () {
    it("resolves the APIClient's stored token", async function () {
      const token = await tokenFor(fakeHeroku('secret-token'))()
      expect(token).to.equal('secret-token')
    })

    it("returns '' when there is no auth entry", async function () {
      const token = await tokenFor(fakeHeroku())()
      expect(token).to.equal('')
    })

    it("returns '' when the entry has no token", async function () {
      const heroku = {getAuthEntry: stub().resolves({account: 'a', token: undefined})} as unknown as APIClient
      expect(await tokenFor(heroku)()).to.equal('')
    })

    it('is lazy — re-reads the entry on each call rather than snapshotting', async function () {
      const getAuthEntry = stub()
      getAuthEntry.onFirstCall().resolves({account: 'a', token: 'first'})
      getAuthEntry.onSecondCall().resolves({account: 'a', token: 'second'})
      const provider = tokenFor({getAuthEntry} as unknown as APIClient)
      expect(await provider()).to.equal('first')
      expect(await provider()).to.equal('second')
    })
  })

  describe('sdkOptions', function () {
    it('wires a lazy token provider onto the common clientOptions', async function () {
      const {clientOptions} = sdkOptions(fakeHeroku('tok'))
      expect(clientOptions?.token).to.be.a('function')
      // the provider is the lazy one, not a snapshot string
      expect(await (clientOptions!.token as () => Promise<string>)()).to.equal('tok')
    })

    it('defaults a warn sink onto the common clientOptions so API warnings reach every service', function () {
      const {clientOptions} = sdkOptions(fakeHeroku('tok'))
      // on the *common* options (not per-service) → forwarded to every client the SDK builds
      expect(clientOptions?.warn).to.equal(oclifWarn)
    })

    it('lets a caller-supplied warn win', function () {
      const warn = stub()
      const {clientOptions} = sdkOptions(fakeHeroku('tok'), {clientOptions: {warn}})
      expect(clientOptions?.warn).to.equal(warn)
    })

    it('lets a caller disable the warn sink with warn: undefined', function () {
      const {clientOptions} = sdkOptions(fakeHeroku('tok'), {clientOptions: {warn: undefined}})
      expect(clientOptions).to.have.property('warn', undefined)
    })

    it('sets baseUrl on the platform service only, never on common clientOptions', function () {
      const opts = sdkOptions(fakeHeroku('tok'))
      expect(opts.clientOptionsByService?.platform?.baseUrl).to.equal(vars.apiUrl)
      expect(opts.clientOptions).to.not.have.property('baseUrl')
    })

    it('lets a caller-supplied token win', function () {
      const {clientOptions} = sdkOptions(fakeHeroku('tok'), {clientOptions: {token: 'explicit'}})
      expect(clientOptions?.token).to.equal('explicit')
    })

    it('lets a caller-supplied platform override merge over baseUrl', function () {
      const opts = sdkOptions(fakeHeroku('tok'), {
        clientOptionsByService: {platform: {baseUrl: 'https://example.test'}},
      })
      expect(opts.clientOptionsByService?.platform?.baseUrl).to.equal('https://example.test')
    })

    it('passes extensions through untouched', function () {
      const extensions = [{} as never]
      const opts = sdkOptions(fakeHeroku('tok'), {extensions})
      expect(opts.extensions).to.equal(extensions)
    })

    it('defaults the userAgent identity onto the common clientOptions', function () {
      const {clientOptions} = sdkOptions(fakeHeroku('tok'))
      expect(clientOptions?.userAgent).to.deep.equal(expectedUserAgent)
    })

    it("lets a caller's own userAgent win over the default", function () {
      const {clientOptions} = sdkOptions(fakeHeroku('tok'), {clientOptions: {userAgent: {name: 'mine', version: '1.0'}}})
      expect(clientOptions?.userAgent).to.deep.equal({name: 'mine', version: '1.0'})
    })

    it('passes caller headers through untouched', function () {
      const {clientOptions} = sdkOptions(fakeHeroku('tok'), {clientOptions: {headers: {'x-custom': 'yes'}}})
      expect(clientOptions?.headers).to.deep.equal({'x-custom': 'yes'})
    })

    it('defaults the process cancellation signal onto the common clientOptions', function () {
      // On the *common* options so heroku-fetch folds it into every request and
      // the SDK threads it into the clients its extensions build internally.
      const {clientOptions} = sdkOptions(fakeHeroku('tok'))
      expect(clientOptions?.signal).to.be.an.instanceOf(AbortSignal)
    })

    it('shares one process signal across calls (lazy, memoized controller)', function () {
      const a = sdkOptions(fakeHeroku('tok')).clientOptions?.signal
      const b = sdkOptions(fakeHeroku('tok')).clientOptions?.signal
      expect(a).to.equal(b)
    })

    it('lets a caller-supplied signal win', function () {
      const {signal} = new AbortController()
      const {clientOptions} = sdkOptions(fakeHeroku('tok'), {clientOptions: {signal}})
      expect(clientOptions?.signal).to.equal(signal)
    })
  })

  describe('apiClientOptions', function () {
    it('defaults the warn sink so raw-client calls surface API warnings too', function () {
      expect(apiClientOptions(fakeHeroku('tok')).warn).to.equal(oclifWarn)
    })

    it('lets a caller disable the warn sink with warn: undefined', function () {
      expect(apiClientOptions(fakeHeroku('tok'), {warn: undefined})).to.have.property('warn', undefined)
    })

    it('sets baseUrl and a token provider, with caller overrides winning', async function () {
      const opts = apiClientOptions(fakeHeroku('tok'))
      expect(opts.baseUrl).to.equal(vars.apiUrl)
      expect(await (opts.token as () => Promise<string>)()).to.equal('tok')

      // the status command's intentionally-unauthenticated custom-host client
      const custom = apiClientOptions(fakeHeroku('tok'), {baseUrl: 'https://status.test', service: 'custom', token: ''})
      expect(custom.baseUrl).to.equal('https://status.test')
      expect(custom.service).to.equal('custom')
      expect(custom.token).to.equal('')
    })

    it('defaults the userAgent identity', function () {
      expect(apiClientOptions(fakeHeroku('tok')).userAgent).to.deep.equal(expectedUserAgent)
    })

    it('lets a caller userAgent win', function () {
      expect(apiClientOptions(fakeHeroku('tok'), {userAgent: {name: 'mine', version: '1.0'}}).userAgent)
        .to.deep.equal({name: 'mine', version: '1.0'})
    })

    it('defaults the process cancellation signal so raw-client calls abort on SIGINT/SIGTERM', function () {
      expect(apiClientOptions(fakeHeroku('tok')).signal).to.be.an.instanceOf(AbortSignal)
    })

    it('lets a caller-supplied signal win', function () {
      const {signal} = new AbortController()
      expect(apiClientOptions(fakeHeroku('tok'), {signal}).signal).to.equal(signal)
    })
  })

  describe('createSDK', function () {
    it('constructs a HerokuSDK', function () {
      const sdk = createSDK(fakeHeroku('tok'))
      expect(sdk.platform).to.be.an('object')
    })
  })

  /**
   * The signal does more than cancel in-flight requests: because registering a
   * signal listener suppresses Node's default "exit on signal", the handler must
   * also guarantee the process still terminates on a Ctrl-C during a non-SDK
   * wait when nothing else (the telemetry handler) would exit. These tests pin
   * the abort-then-exit path with the telemetry handler both absent and present.
   *
   * We isolate the process's signal listeners for the block (saving, clearing,
   * and restoring the originals) so `listenerCount` is deterministic, stub
   * `process.exit` so the deferred exit doesn't kill the test run, and reset the
   * module's memoized controller around every test so no wiring leaks.
   */
  describe('cliAbortSignal termination', function () {
    let savedSigint: NodeJS.SignalsListener[]
    let savedSigterm: NodeJS.SignalsListener[]
    let exitStub: ReturnType<typeof stub>

    const flushImmediate = () => new Promise(resolve => {
      setImmediate(resolve)
    })

    before(function () {
      savedSigint = process.listeners('SIGINT')
      savedSigterm = process.listeners('SIGTERM')
      process.removeAllListeners('SIGINT')
      process.removeAllListeners('SIGTERM')
    })

    after(function () {
      process.removeAllListeners('SIGINT')
      process.removeAllListeners('SIGTERM')
      for (const l of savedSigint) process.on('SIGINT', l)
      for (const l of savedSigterm) process.on('SIGTERM', l)
    })

    beforeEach(function () {
      resetCliAbortSignal()
      exitStub = stub(process, 'exit')
    })

    afterEach(function () {
      resetCliAbortSignal()
      exitStub.restore()
    })

    it('aborts the signal on SIGINT', function () {
      const signal = sdkOptions(fakeHeroku('tok')).clientOptions?.signal as AbortSignal
      expect(signal.aborted).to.be.false
      process.emit('SIGINT', 'SIGINT')
      expect(signal.aborted).to.be.true
    })

    it('restores termination (deferred process.exit) when no other signal handler remains', async function () {
      sdkOptions(fakeHeroku('tok'))
      process.emit('SIGINT', 'SIGINT')
      // deferred: not exited synchronously, so aborted requests can unwind first
      expect(exitStub.called).to.be.false
      await flushImmediate()
      expect(exitStub.calledOnceWithExactly(1)).to.be.true
    })

    it('leaves the exit to the telemetry handler when one is registered', async function () {
      const telemetryHandler = stub()
      process.on('SIGINT', telemetryHandler)
      try {
        sdkOptions(fakeHeroku('tok'))
        process.emit('SIGINT', 'SIGINT')
        await flushImmediate()
        // the telemetry handler ran and still owns the exit; we did not exit too
        expect(telemetryHandler.calledOnce).to.be.true
        expect(exitStub.called).to.be.false
      } finally {
        process.removeListener('SIGINT', telemetryHandler)
      }
    })

    it('drops its one-shot listeners after firing so a second signal is not handled by it', async function () {
      sdkOptions(fakeHeroku('tok'))
      expect(process.listenerCount('SIGINT')).to.equal(1)
      process.emit('SIGINT', 'SIGINT')
      await flushImmediate()
      expect(process.listenerCount('SIGINT')).to.equal(0)
    })

    it('aborts and restores termination on SIGTERM too', async function () {
      const signal = sdkOptions(fakeHeroku('tok')).clientOptions?.signal as AbortSignal
      process.emit('SIGTERM', 'SIGTERM')
      expect(signal.aborted).to.be.true
      await flushImmediate()
      expect(exitStub.calledOnceWithExactly(1)).to.be.true
    })

    it('hands back a fresh, non-aborted signal for a client built after an abort', function () {
      const first = sdkOptions(fakeHeroku('tok')).clientOptions?.signal as AbortSignal
      process.emit('SIGINT', 'SIGINT')
      expect(first.aborted).to.be.true
      const second = sdkOptions(fakeHeroku('tok')).clientOptions?.signal as AbortSignal
      expect(second).to.not.equal(first)
      expect(second.aborted).to.be.false
    })
  })
})
