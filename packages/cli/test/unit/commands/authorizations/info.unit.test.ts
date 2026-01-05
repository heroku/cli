import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {formatDistanceToNow} from 'date-fns'
import nock from 'nock'

describe('authorizations:info', function () {
  afterEach(() => nock.cleanAll())

  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'
  const authorization = {
    id: authorizationID,
    description: 'desc',
    scope: ['global'],
    access_token: {token: 'secrettoken'},
    updated_at: new Date(0),
  }
  const authorizationWithExpiration = {
    ...authorization,
    access_token: {token: 'secrettoken', expires_in: 100000},
  }

  it('shows the authorization', async () => {
    nock('https://api.heroku.com:443')
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

  it('shows expires in', async () => {
    nock('https://api.heroku.com:443')
      .get(`/oauth/authorizations/${authorizationID}`)
      .reply(200, authorizationWithExpiration)

    const {stdout} = await runCommand(['authorizations:info', authorizationID])

    expect(stdout).to.contain('(in 1 day)')
  })

  describe('with json flag', function () {
    it('shows the authorization as json', async () => {
      nock('https://api.heroku.com:443')
        .get(`/oauth/authorizations/${authorizationID}`)
        .reply(200, authorization)

      const {stdout} = await runCommand(['authorizations:info', authorizationID, '--json'])

      const authJSON = JSON.parse(stdout)
      expect(authJSON.id).to.eql(authorization.id)
      expect(authJSON.description).to.eql(authorization.description)
    })
  })
})
