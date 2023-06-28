import {expect, test} from '@oclif/test'

describe('auth:whoami', () => {
  test
    .env({HEROKU_API_KEY: 'foobar'})
    .nock('https://api.heroku.com', api => api
      .get('/account')
      .reply(200, {email: 'jeff@example.com'}),
    )
    .stdout()
    .stderr()
    .command(['auth:whoami'])
    .it('shows user email when logged in', ctx => {
      expect(ctx.stdout).to.equal('jeff@example.com\n')
      expect(ctx.stderr).to.contain('Warning: HEROKU_API_KEY is set')
    })

  test
    .env({HEROKU_API_KEY: 'foobar'})
    .nock('https://api.heroku.com', api => api
      .get('/account')
      .reply(401),
    )
    .stderr()
    .command(['auth:whoami'])
    .exit(100)
    .it('exits with status 100 when not logged in', ctx => {
      expect(ctx.stderr).to.contain('Warning: HEROKU_API_KEY is set')
    })
})
