import type {OauthAuthorization} from '@heroku/types/3.sdk'

import {captureOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'

import AuthorizationsCreate from '../../../../src/commands/authorizations/create.js'
import {clientAuthorization, tokenAuthorization} from '../../../fixtures/authorizations/fixtures.js'
import {expectJsonSnapshot, runCommandJson} from '../../../helpers/json-snapshot.js'
import {getConfig} from '../../../helpers/test-instances.js'
import {withRealUxAction} from '../../../helpers/ux-stub.js'

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

  context('with short flag and HEROKU_CONTENT_TYPE=json', function () {
    let previous: string | undefined

    beforeEach(function () {
      previous = process.env.HEROKU_CONTENT_TYPE
      process.env.HEROKU_CONTENT_TYPE = 'json'
    })

    afterEach(function () {
      if (previous === undefined) delete process.env.HEROKU_CONTENT_TYPE
      else process.env.HEROKU_CONTENT_TYPE = previous
    })

    it('prints only the token, not JSON', async function () {
      fakePlatform.oauthAuthorization.create.resolves(tokenAuthorization)
      const cmd = new AuthorizationsCreate(['--short'], await getConfig()) as unknown as {_run(): Promise<unknown>}

      const {stdout} = await captureOutput(async () => {
        await cmd._run()
      })

      expect(stdout).to.equal('HRKU-fake-access-token-0000\n')
    })
  })

  describe('--json', function () {
    it('renders an API error as a JSON error document', async function () {
      fakePlatform.oauthAuthorization.create.rejects(new Error('Couldn\'t find that authorization.'))

      for (const activation of ['flag', 'env'] as const) {
        // The real spinner buffers stdout while it runs, so the error document must still be printed.
        // eslint-disable-next-line no-await-in-loop -- runs must not overlap; each sets or clears HEROKU_CONTENT_TYPE
        const {exitCode, json} = await withRealUxAction(() => runCommandJson<{error: {message: string}}>(AuthorizationsCreate, ['--description', 'test'], {activation}))

        expect(exitCode, activation).to.equal(1)
        expect(json.error.message, activation).to.equal('Couldn\'t find that authorization.')
      }
    })

    it('returns the created authorization', async function () {
      fakePlatform.oauthAuthorization.create.resolves(tokenAuthorization)

      await expectJsonSnapshot<OauthAuthorization>(this, AuthorizationsCreate, ['--description', 'b description'])
    })

    it('returns the authorization created for the team', async function () {
      fakePlatform.oauthAuthorization.teamCreate.resolves(clientAuthorization)

      await expectJsonSnapshot<OauthAuthorization>(this, AuthorizationsCreate, ['--description', 'awesome', '--team', 'my-team'])
    })

    // Asserted via runCommand: oclif's parse-error document under --json serializes the whole
    // parse context (including Config), which isn't a useful thing to pin here.
    it('rejects --short with --json', async function () {
      const {error} = await runCommand(AuthorizationsCreate, ['--short', '--json'])

      expect(ansis.strip(error?.message ?? '')).to.contain('--json=true cannot also be provided when using --short')
      expect(fakePlatform.oauthAuthorization.create.called).to.equal(false)
    })
  })
})
