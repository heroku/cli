import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import AuthorizationsRotate from '../../../../src/commands/authorizations/rotate.js'

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
})
