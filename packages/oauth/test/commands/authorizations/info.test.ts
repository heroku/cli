import {expect, test} from '@oclif/test'
import * as distanceInWordsToNow from 'date-fns/distance_in_words_to_now'

describe('authorizations:info', () => {
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'
  const authorization = {
    id: authorizationID,
    description: 'desc',
    scope: ['global'],
    access_token: {token: 'secrettoken'},
    updated_at: new Date(0),
  }

  const testWithAuthorization = () =>
    test
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
      .get(`/oauth/authorizations/${authorizationID}`)
      .reply(200, authorization)
    })

  testWithAuthorization()
  .command(['authorizations:info', authorizationID])
  .it('shows the authorization', ctx => {
    expect(ctx.stdout).to.eq(
      'Client:      <none>\n' +
        'ID:          4UTHOri24tIoN-iD-3X4mPl3\n' +
        'Description: desc\n' +
        'Scope:       global\n' +
        'Token:       secrettoken\n' +
        `Updated at:  ${new Date(0)} (${distanceInWordsToNow(new Date(0))} ago)\n`,
    )
  })

  describe('with json flag', () => {
    testWithAuthorization()
    .command(['authorizations:info', authorizationID, '--json'])
    .it('shows the authorization as json', ctx => {
      const authJSON = JSON.parse(ctx.stdout)

      expect(authJSON.id).to.eql(authorization.id)
      expect(authJSON.description).to.eql(authorization.description)
    })
  })
})
