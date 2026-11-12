import type {OauthAuthorization} from '@heroku/types/3.sdk'

import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import AuthorizationsUpdate from '../../../../src/commands/authorizations/update.js'
import {clientAuthorization} from '../../../fixtures/authorizations/fixtures.js'
import {expectJsonSnapshot, runCommandJson} from '../../../helpers/json-snapshot.js'
import {withRealUxAction} from '../../../helpers/ux-stub.js'

type FakePlatform = {
  oauthAuthorization: {update: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthAuthorization: {update: sinon.stub()},
  }
}

describe('authorizations:update', function () {
  let fakePlatform: FakePlatform
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('updates the authorization', async function () {
    fakePlatform.oauthAuthorization.update.resolves({
      access_token: {token: 'secrettoken'},
      description: 'awesome',
      id: '100',
      scope: ['global'],
    })

    const {stdout} = await runCommand(AuthorizationsUpdate, [authorizationID, '--client-id', '100', '--client-secret', 'secret', '--description', 'awesome'])

    expect(stdout).to.eq('Client:      <none>\n'
      + 'ID:          100\n'
      + 'Description: awesome\n'
      + 'Scope:       global\n'
      + 'Token:       secrettoken\n')
    expect(fakePlatform.oauthAuthorization.update.calledOnceWithExactly(
      authorizationID,
      {client: {id: '100', secret: 'secret'}, description: 'awesome'},
    )).to.equal(true)
  })

  describe('--json', function () {
    it('renders an API error as a JSON error document', async function () {
      fakePlatform.oauthAuthorization.update.rejects(new Error('Couldn\'t find that authorization.'))

      for (const activation of ['flag', 'env'] as const) {
        // The real spinner buffers stdout while it runs, so the error document must still be printed.
        // eslint-disable-next-line no-await-in-loop -- runs must not overlap; each sets or clears HEROKU_CONTENT_TYPE
        const {exitCode, json} = await withRealUxAction(() => runCommandJson<{error: {message: string}}>(AuthorizationsUpdate, [authorizationID, '--description', 'awesome'], {activation}))

        expect(exitCode, activation).to.equal(1)
        expect(json.error.message, activation).to.equal('Couldn\'t find that authorization.')
      }
    })

    it('returns the updated authorization', async function () {
      fakePlatform.oauthAuthorization.update.resolves(clientAuthorization)

      await expectJsonSnapshot<OauthAuthorization>(this, AuthorizationsUpdate, [clientAuthorization.id, '--description', 'awesome'])
    })
  })
})
