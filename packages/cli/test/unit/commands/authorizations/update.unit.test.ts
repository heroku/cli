import {expect, test} from '@oclif/test'

describe('authorizations:update', function () {
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'

  test
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .patch(
          `/oauth/authorizations/${authorizationID}`,
          {description: 'awesome', client: {id: '100', secret: 'secret'}},
        )
        .reply(
          200,
          {scope: ['global'], access_token: {token: 'secrettoken'}, description: 'awesome', id: '100'},
        )
    })
    .command(
      ['authorizations:update', authorizationID, '--client-id', '100', '--client-secret', 'secret', '--description', 'awesome'],
    )
    .it('updates the authorization', ctx => {
      expect(ctx.stdout).to.eq(
        'Client:      <none>\n' +
        'ID:          100\n' +
        'Description: awesome\n' +
        'Scope:       global\n' +
        'Token:       secrettoken\n',
      )
    })
})
