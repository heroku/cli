import {APIClient, vars} from '@heroku-cli/command'
import {warn as oclifWarn} from '@oclif/core/errors'
import {expect} from 'chai'
import {readFileSync} from 'node:fs'
import {stub} from 'sinon'

import {
  apiClientOptions, createSDK, sdkOptions, tokenFor,
} from '../../../src/lib/sdk.js'

// The User-Agent the helpers default onto every request. Built the same way the
// implementation does — CLI package.json version + process.platform — so the
// assertion tracks a version bump instead of hard-coding a number that rots.
const {version: cliVersion} = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')) as {version: string}
const expectedUserAgent = `heroku-cli/${cliVersion} ${process.platform}`

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

    it('defaults the user-agent header onto the common clientOptions', function () {
      const {clientOptions} = sdkOptions(fakeHeroku('tok'))
      expect(clientOptions?.headers?.['user-agent']).to.equal(expectedUserAgent)
    })

    it('merges caller headers with the default user-agent rather than replacing them', function () {
      const {clientOptions} = sdkOptions(fakeHeroku('tok'), {clientOptions: {headers: {'x-custom': 'yes'}}})
      expect(clientOptions?.headers).to.deep.equal({'user-agent': expectedUserAgent, 'x-custom': 'yes'})
    })

    it("lets a caller's own user-agent win over the default", function () {
      const {clientOptions} = sdkOptions(fakeHeroku('tok'), {clientOptions: {headers: {'user-agent': 'mine/1.0'}}})
      expect(clientOptions?.headers?.['user-agent']).to.equal('mine/1.0')
    })

    it('defaults the process cancellation signal onto the common clientOptions', function () {
      // On the *common* options so heroku-fetch folds it into every request and
      // the SDK threads it into the clients its extensions build internally —
      // this is what replaced the bindAbortSignal proxy.
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

    it('defaults the user-agent header', function () {
      expect(apiClientOptions(fakeHeroku('tok')).headers?.['user-agent']).to.equal(expectedUserAgent)
    })

    it('merges caller headers with the default user-agent, letting a caller user-agent win', function () {
      expect(apiClientOptions(fakeHeroku('tok'), {headers: {'x-custom': 'yes'}}).headers).to.deep.equal({
        'user-agent': expectedUserAgent, 'x-custom': 'yes',
      })
      expect(apiClientOptions(fakeHeroku('tok'), {headers: {'user-agent': 'mine/1.0'}}).headers?.['user-agent'])
        .to.equal('mine/1.0')
    })
  })

  describe('createSDK', function () {
    it('constructs a HerokuSDK', function () {
      const sdk = createSDK(fakeHeroku('tok'))
      expect(sdk.platform).to.be.an('object')
    })
  })
})
