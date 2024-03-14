import {expect, test} from '@oclif/test'

describe('auth:token', () => {
  test
    .env({HEROKU_API_KEY: 'foobar'})
    .nock('https://api.heroku.com', api => api
      .get('/oauth/authorizations')
      .reply(200, [
        {access_token: {token: 'somethingelse'}},
        {access_token: {token: 'foobar', expires_in: 60}},
        {},
      ]),
    )
    .stdout()
    .stderr()
    .command(['auth:token'])
    .it('shows auth token', ctx => {
      expect(ctx.stdout).to.equal('foobar\n')
      expect(ctx.stderr).to.contain('Warning: token will expire today')
    })
})
