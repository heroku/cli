import type {OauthAuthorization} from '@heroku/types/3.sdk'

import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import AuthorizationsRotate from '../../../../src/commands/authorizations/rotate.js'
import {tokenAuthorization} from '../../../fixtures/authorizations/fixtures.js'
import {expectJsonSnapshot, runCommandJson} from '../../../helpers/json-snapshot.js'
import {withRealUxAction} from '../../../helpers/ux-stub.js'

type FakePlatform = {
  oauthAuthorization: {regenerate: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthAuthorization: {regenerate: sinon.stub()},
  }
}

describe('authorizations:rotate', function () {
  let fakePlatform: FakePlatform
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('rotates and prints the authentication', async function () {
    fakePlatform.oauthAuthorization.regenerate.resolves({access_token: {token: 'secrettoken'}, scope: ['global', 'app']})

    const {stderr, stdout} = await runCommand(AuthorizationsRotate, [authorizationID])

    expect(stdout).to.contain('Client: <none>\n')
    expect(stdout).to.contain('Scope:  global,app\n')
    expect(stdout).to.contain('Token:  secrettoken\n')
    expect(stderr).to.contain('Rotating OAuth Authorization... done')
    expect(fakePlatform.oauthAuthorization.regenerate.calledOnceWithExactly(authorizationID)).to.equal(true)
  })

  describe('--json', function () {
    it('renders an API error as a JSON error document', async function () {
      fakePlatform.oauthAuthorization.regenerate.rejects(new Error('Couldn\'t find that authorization.'))

      for (const activation of ['flag', 'env'] as const) {
        // The real spinner buffers stdout while it runs, so the error document must still be printed.
        // eslint-disable-next-line no-await-in-loop -- runs must not overlap; each sets or clears HEROKU_CONTENT_TYPE
        const {exitCode, json} = await withRealUxAction(() => runCommandJson<{error: {message: string}}>(AuthorizationsRotate, [authorizationID], {activation}))

        expect(exitCode, activation).to.equal(1)
        expect(json.error.message, activation).to.equal('Couldn\'t find that authorization.')
      }
    })

    it('returns the rotated authorization', async function () {
      fakePlatform.oauthAuthorization.regenerate.resolves(tokenAuthorization)

      await expectJsonSnapshot<OauthAuthorization>(this, AuthorizationsRotate, [tokenAuthorization.id])
    })
  })
})
