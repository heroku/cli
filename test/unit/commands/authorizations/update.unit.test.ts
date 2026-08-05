import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import AuthorizationsUpdate from '../../../../src/commands/authorizations/update.js'

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
})
