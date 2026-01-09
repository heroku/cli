import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('authorizations:update', function () {
  let api: nock.Scope
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('updates the authorization', async function () {
    api
      .patch(
        `/oauth/authorizations/${authorizationID}`,
        {client: {id: '100', secret: 'secret'}, description: 'awesome'},
      )
      .reply(
        200,
        {
          access_token: {token: 'secrettoken'},
          description: 'awesome',
          id: '100',
          scope: ['global'],
        },
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
