import {expect, test} from '@oclif/test'

describe('enterprises:teams:create', () => {
  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .post('/enterprise-accounts/suisse/teams', {name: 'team-geneve'})
      .reply(201)
    )
    .command(['enterprises:teams:create', 'team-geneve', '--enterprise-account', 'suisse'])
    .it('creates a new team for an enterprise account', ctx => {
      expect(ctx.stderr).to.contain('Creating team-geneve in suisse... done')
    })
})
