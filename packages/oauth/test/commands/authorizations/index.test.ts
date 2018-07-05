import {expect, test} from '@oclif/test'

describe('authorizations', () => {
  test
  .stdout()
  .nock('https://api.heroku.com:443', api => api
    .get('/oauth/authorizations')
    .reply(200, []))
  .command(['authorizations'])
  .it('shows no authorizations message', ctx => {
    expect(ctx.stdout).to.contain('No OAuth authorizations.\n')
  })
})
