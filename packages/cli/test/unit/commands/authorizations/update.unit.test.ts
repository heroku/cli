import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('authorizations:update', function () {
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'

  afterEach(() => nock.cleanAll())

  it('updates the authorization', async () => {
    nock('https://api.heroku.com:443')
      .patch(
        `/oauth/authorizations/${authorizationID}`,
        {description: 'awesome', client: {id: '100', secret: 'secret'}},
      )
      .reply(
        200,
        {scope: ['global'], access_token: {token: 'secrettoken'}, description: 'awesome', id: '100'},
      )

    const {stdout} = await runCommand(
      ['authorizations:update', authorizationID, '--client-id', '100', '--client-secret', 'secret', '--description', 'awesome'],
    )

    expect(stdout).to.eq(
      'Client:      <none>\n'
      + 'ID:          100\n'
      + 'Description: awesome\n'
      + 'Scope:       global\n'
      + 'Token:       secrettoken\n',
    )
  })
})
