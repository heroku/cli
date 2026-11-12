import type {OauthAuthorization} from '@heroku/types/3.sdk'

import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import AuthorizationsRevoke from '../../../../src/commands/authorizations/revoke.js'
import {tokenAuthorization} from '../../../fixtures/authorizations/fixtures.js'
import {expectJsonSnapshot, runCommandJson} from '../../../helpers/json-snapshot.js'
import {withRealUxAction} from '../../../helpers/ux-stub.js'

type FakePlatform = {
  oauthAuthorization: {delete: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthAuthorization: {delete: sinon.stub()},
  }
}

describe('authorizations:revoke', function () {
  let fakePlatform: FakePlatform
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('revokes the authorization', async function () {
    fakePlatform.oauthAuthorization.delete.resolves({description: 'Example Auth'})

    const {stderr} = await runCommand(AuthorizationsRevoke, [authorizationID])

    expect(stderr).to.contain('done, revoked authorization from Example Auth')
    expect(fakePlatform.oauthAuthorization.delete.calledOnceWithExactly(authorizationID)).to.equal(true)
  })

  context('without an ID argument', function () {
    it('shows required ID error', async function () {
      const {error} = await runCommand(AuthorizationsRevoke, [])

      expect(error?.message).to.equal('Missing 1 required arg:\nid  ID of the authorization\nSee more help with --help')
    })
  })

  describe('--json', function () {
    it('returns the revoked authorization', async function () {
      fakePlatform.oauthAuthorization.delete.resolves(tokenAuthorization)

      await expectJsonSnapshot<OauthAuthorization>(this, AuthorizationsRevoke, [tokenAuthorization.id])
    })

    it('renders an API error as a JSON error document', async function () {
      fakePlatform.oauthAuthorization.delete.rejects(new Error('Couldn\'t find that authorization.'))

      for (const activation of ['flag', 'env'] as const) {
        // The real spinner buffers stdout while it runs, so the error document must still be printed.
        // eslint-disable-next-line no-await-in-loop -- runs must not overlap; each sets or clears HEROKU_CONTENT_TYPE
        const {exitCode, json} = await withRealUxAction(() => runCommandJson<{error: {message: string}}>(AuthorizationsRevoke, [authorizationID], {activation}))

        expect(exitCode, activation).to.equal(1)
        expect(json.error.message, activation).to.equal('Couldn\'t find that authorization.')
      }
    })
  })
})
