import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import AuthorizationsCreate from '../../../../src/commands/authorizations/create.js'

// Anchor the fake to the real SDK platform so renaming the oauthAuthorization.create
// path fails to compile here; intersect with SinonStub so the stub assertions stay available.
type FakePlatform = {
  oauthAuthorization: {
    create: HerokuSDK['platform']['oauthAuthorization']['create'] & sinon.SinonStub
    teamCreate: HerokuSDK['platform']['oauthAuthorization']['teamCreate'] & sinon.SinonStub
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthAuthorization: {create: sinon.stub(), teamCreate: sinon.stub()},
  }
}

describe('authorizations:create', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('creates the authorization', async function () {
    fakePlatform.oauthAuthorization.create.resolves({access_token: {token: 'secrettoken'}, scope: ['global']})

    const {stdout} = await runCommand(AuthorizationsCreate, ['--description', 'awesome'])

    expect(stdout).to.contain('Client: <none>\n')
    expect(stdout).to.contain('Scope:  global\n')
    expect(stdout).to.contain('Token:  secrettoken\n')
    expect(fakePlatform.oauthAuthorization.create.calledOnceWithExactly({
      description: 'awesome',
      expires_in: undefined,
      scope: undefined,
    })).to.equal(true)
  })

  context('with short flag', function () {
    it('only prints token', async function () {
      fakePlatform.oauthAuthorization.create.resolves({access_token: {token: 'secrettoken'}, scope: ['global']})

      const {stdout} = await runCommand(AuthorizationsCreate, ['--expires-in', '10000', '--short'])

      expect(stdout).to.equal('secrettoken\n')
      expect(fakePlatform.oauthAuthorization.create.calledOnceWithExactly({
        description: undefined,
        expires_in: 10_000,
        scope: undefined,
      })).to.equal(true)
    })
  })

  context('with json flag', function () {
    it('prints json', async function () {
      fakePlatform.oauthAuthorization.create.resolves({access_token: {token: 'secrettoken'}, scope: ['global']})

      const {stdout} = await runCommand(AuthorizationsCreate, ['--json'])

      const json = JSON.parse(stdout)
      expect(json.access_token).to.contain({token: 'secrettoken'})
      expect(json.scope).to.contain('global')
    })
  })

  context('with team flag', function () {
    it('creates the authorization for the team', async function () {
      fakePlatform.oauthAuthorization.teamCreate.resolves({access_token: {token: 'secrettoken'}, scope: ['global']})

      const {stdout} = await runCommand(AuthorizationsCreate, ['--description', 'awesome', '--team', 'my-team'])

      expect(stdout).to.contain('Client: <none>\n')
      expect(stdout).to.contain('Scope:  global\n')
      expect(stdout).to.contain('Token:  secrettoken\n')
      expect(fakePlatform.oauthAuthorization.teamCreate.calledOnceWithExactly('my-team', {
        description: 'awesome',
        expires_in: undefined,
        scope: undefined,
      })).to.equal(true)
    })
  })
})
