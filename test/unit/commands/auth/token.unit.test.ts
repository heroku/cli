import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'

import Token from '../../../../src/commands/auth/token.js'

type FakePlatform = {
  oauthAuthorization: {list: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthAuthorization: {list: stub()},
  }
}

describe('auth:token', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    stub(APIClient.prototype, 'auth').get(() => 'foobar')
  })

  afterEach(function () {
    restore()
  })

  it('shows auth token', async function () {
    fakePlatform.oauthAuthorization.list.resolves([
      {access_token: {token: 'somethingelse'}},
      {access_token: {expires_in: 60, token: 'foobar'}, user: {email: 'foo@bar.com'}},
      {},
    ])

    const {stderr, stdout} = await runCommand(Token, [])

    expect(stdout).to.equal('foobar\n')
    expect(stderr).to.contain('Warning: token will expire today')
  })

  it('shows "long-term" token generation warning for non-internal users', async function () {
    fakePlatform.oauthAuthorization.list.resolves([
      {access_token: {token: 'somethingelse'}},
      {access_token: {expires_in: 60, token: 'foobar'}, user: {email: 'foo@bar.com'}},
      {},
    ])

    const {stderr, stdout} = await runCommand(Token, [])

    expect(stdout).to.equal('foobar\n')
    expect(stderr).to.contain('To generate a token that expires in one year, use heroku')
    expect(stderr).to.contain('authorizations:create.')
    expect(stderr).to.not.contain('All tokens expire one year after we generate it.')
  })

  it('shows AT2 token generation warning for internal users', async function () {
    fakePlatform.oauthAuthorization.list.resolves([
      {access_token: {token: 'somethingelse'}},
      {access_token: {expires_in: 60, token: 'foobar'}, user: {email: 'foo@heroku.com'}},
      {},
    ])

    const {stderr, stdout} = await runCommand(Token, [])

    expect(stdout).to.equal('foobar\n')
    expect(stderr).to.contain('All tokens expire one year after we generate it.')
    expect(stderr).to.not.contain('To generate a token that expires in one year, use heroku authorizations:create.')
  })
})

describe('auth:token reauthorize opt-out', function () {
  // auth:token passes reauthorize: undefined to createSDK, so a 401 on the
  // authorization lookup falls through to the warn + print-stored-token path
  // rather than prompting for an interactive login. Runs the real SDK over nock
  // (no platform getter stub); login() firing is what would distinguish the
  // default from the opt-out, so we assert it never does.
  afterEach(function () {
    nock.cleanAll()
    restore()
  })

  it('never prompts for re-login on a 401 — warns and prints the stored token', async function () {
    const login = stub(APIClient.prototype, 'login').resolves()
    stub(APIClient.prototype, 'getAuthEntry').resolves({account: undefined, token: 'foobar'})
    stub(APIClient.prototype, 'auth').get(() => 'foobar')
    nock('https://api.heroku.com').persist().get(/.*/).reply(401, {id: 'unauthorized'})

    const {stdout} = await runCommand(Token, [])

    expect(login.called).to.equal(false)
    expect(stdout).to.equal('foobar\n')
  })
})
