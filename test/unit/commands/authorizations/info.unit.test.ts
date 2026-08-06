import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {formatDistanceToNow} from 'date-fns'
import * as sinon from 'sinon'

import AuthorizationsInfo from '../../../../src/commands/authorizations/info.js'

type FakePlatform = {
  oauthAuthorization: {info: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthAuthorization: {info: sinon.stub()},
  }
}

describe('authorizations:info', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'
  const authorization = {
    access_token: {token: 'secrettoken'},
    description: 'desc',
    id: authorizationID,
    scope: ['global'],
    updated_at: new Date(0),
  }
  const authorizationWithExpiration = {
    ...authorization,
    access_token: {expires_in: 100_000, token: 'secrettoken'},
  }

  it('shows the authorization', async function () {
    fakePlatform.oauthAuthorization.info.resolves(authorization)

    const {stdout} = await runCommand(AuthorizationsInfo, [authorizationID])

    expect(stdout).to.eq('Client:      <none>\n'
      + 'ID:          4UTHOri24tIoN-iD-3X4mPl3\n'
      + 'Description: desc\n'
      + 'Scope:       global\n'
      + 'Token:       secrettoken\n'
      + `Updated at:  ${new Date(0)} (${formatDistanceToNow(new Date(0))} ago)\n`)
    expect(fakePlatform.oauthAuthorization.info.calledOnceWithExactly(authorizationID)).to.equal(true)
  })

  it('shows expires in', async function () {
    fakePlatform.oauthAuthorization.info.resolves(authorizationWithExpiration)

    const {stdout} = await runCommand(AuthorizationsInfo, [authorizationID])

    expect(stdout).to.contain('(in 1 day)')
  })

  describe('with json flag', function () {
    it('shows the authorization as json', async function () {
      fakePlatform.oauthAuthorization.info.resolves(authorization)

      const {stdout} = await runCommand(AuthorizationsInfo, [authorizationID, '--json'])

      const authJSON = JSON.parse(stdout)
      expect(authJSON.id).to.eql(authorization.id)
      expect(authJSON.description).to.eql(authorization.description)
    })
  })
})
