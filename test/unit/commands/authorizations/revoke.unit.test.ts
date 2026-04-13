import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import AuthorizationsRevoke from '../../../../src/commands/authorizations/revoke.js'

describe('authorizations:revoke', function () {
  let api: nock.Scope
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('revokes the authorization', async function () {
    api
      .delete(`/oauth/authorizations/${authorizationID}`)
      .reply(200, {description: 'Example Auth'})

    const {stderr} = await runCommand(AuthorizationsRevoke, [authorizationID])

    expect(stderr).to.contain('done, revoked authorization from Example Auth')
  })

  context('without an ID argument', function () {
    it('shows required ID error', async function () {
      const {error} = await runCommand(AuthorizationsRevoke, [])

      expect(error?.message).to.equal('Missing 1 required arg:\nid  ID of the authorization\nSee more help with --help')
    })
  })
})
