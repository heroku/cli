import {expect, test} from '../../test'

describe('auth:whoami', () => {
  test
  .nock('https://api.heroku.com', api => api
    .get('/account')
    .reply(200, {email: 'jeff@example.com'})
  )
  .stdout()
  .command(['auth:whoami'])
  .it('shows user email when logged in', ctx => {
    expect(ctx.stdout).to.equal('jeff@example.com\n')
  })

  test
  .nock('https://api.heroku.com', api => api
    .get('/account')
    .reply(401)
  )
  .command(['auth:whoami'])
  .exit(100)
  .it('exits with status 100 when not logged in')
})
