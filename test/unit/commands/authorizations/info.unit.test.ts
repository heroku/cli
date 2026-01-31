import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {formatDistanceToNow} from 'date-fns'
import nock from 'nock'

describe('authorizations:info', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
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
    access_token: {expires_in: 100000, token: 'secrettoken'},
  }

  it('shows the authorization', async function () {
    api
      .get(`/oauth/authorizations/${authorizationID}`)
      .reply(200, authorization)

    const {stdout} = await runCommand(['authorizations:info', authorizationID])

    expect(stdout).to.eq(
      'Client:      <none>\n'
      + 'ID:          4UTHOri24tIoN-iD-3X4mPl3\n'
      + 'Description: desc\n'
      + 'Scope:       global\n'
      + 'Token:       secrettoken\n'
      + `Updated at:  ${new Date(0)} (${formatDistanceToNow(new Date(0))} ago)\n`,
    )
  })

  it('shows expires in', async function () {
    api
      .get(`/oauth/authorizations/${authorizationID}`)
      .reply(200, authorizationWithExpiration)

    const {stdout} = await runCommand(['authorizations:info', authorizationID])

    expect(stdout).to.contain('(in 1 day)')
  })

  describe('with json flag', function () {
    it('shows the authorization as json', async function () {
      api
        .get(`/oauth/authorizations/${authorizationID}`)
        .reply(200, authorization)

      const {stdout} = await runCommand(['authorizations:info', authorizationID, '--json'])

      const authJSON = JSON.parse(stdout)
      expect(authJSON.id).to.eql(authorization.id)
      expect(authJSON.description).to.eql(authorization.description)
    })
  })
})
