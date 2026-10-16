import {APIClient, vars} from '@heroku-cli/command'
import {expect} from 'chai'
import {stub} from 'sinon'

import {
  apiClientOptions, createSDK, sdkOptions, tokenFor,
} from '../../../src/lib/sdk.js'

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
  })

  describe('apiClientOptions', function () {
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
  })

  describe('createSDK', function () {
    it('constructs a HerokuSDK', function () {
      const sdk = createSDK(fakeHeroku('tok'))
      expect(sdk.platform).to.be.an('object')
    })
  })
})
