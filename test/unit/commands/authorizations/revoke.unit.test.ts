import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import AuthorizationsRevoke from '../../../../src/commands/authorizations/revoke.js'

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
})
