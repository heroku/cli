import {expect, test} from '@oclif/test'

describe('auth:token', () => {
  test
    .env({HEROKU_API_KEY: 'foobar'})
    .nock('https://api.heroku.com', api => api
      .get('/oauth/authorizations')
      .reply(200, [
        {access_token: {token: 'somethingelse'}},
        {access_token: {token: 'foobar', expires_in: 60}, user: {email: 'foo@bar.com'}},
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

  test
    .env({HEROKU_API_KEY: 'foobar'})
    .nock('https://api.heroku.com', api => api
      .get('/oauth/authorizations')
      .reply(200, [
        {access_token: {token: 'somethingelse'}},
        {access_token: {token: 'foobar', expires_in: 60}, user: {email: 'foo@bar.com'}},
        {},
      ]),
    )
    .stdout()
    .stderr()
    .command(['auth:token'])
    .it('shows "long-term" token generation warning for non-internal users', ctx => {
      expect(ctx.stdout).to.equal('foobar\n')
      expect(ctx.stderr).to.contain('To generate a token that expires in one year, use heroku authorizations:create.')
      expect(ctx.stderr).to.not.contain('All tokens expire one year after we generate it.')
    })

  test
    .env({HEROKU_API_KEY: 'foobar'})
    .nock('https://api.heroku.com', api => api
      .get('/oauth/authorizations')
      .reply(200, [
        {access_token: {token: 'somethingelse'}},
        {access_token: {token: 'foobar', expires_in: 60}, user: {email: 'foo@heroku.com'}},
        {},
      ]),
    )
    .stdout()
    .stderr()
    .command(['auth:token'])
    .it('shows AT2 token generation warning for internal users', ctx => {
      expect(ctx.stdout).to.equal('foobar\n')
      expect(ctx.stderr).to.contain('All tokens expire one year after we generate it.')
      expect(ctx.stderr).to.not.contain('To generate a token that expires in one year, use heroku authorizations:create.')
    })
})
