import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
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
