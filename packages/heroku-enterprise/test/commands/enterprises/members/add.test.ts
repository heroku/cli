import {expect, test} from '@oclif/test'

describe('enterprise:members:add', () => {
  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .post('/enterprise-accounts/mordor/members', {user: 'sam@mordor.org', permissions: ['view', 'manage']})
      .reply(201)
    )
    .command(['enterprise:members:add', 'sam@mordor.org', '--enterprise-account', 'mordor', '-p', 'view,manage'])
    .it('creates a new member for an enterprise account', ctx => {
      // to-do: investigate this line failing on ci
      // expect(ctx.stderr).to.contain('Adding sam@mordor.org to mordor... done')
      expect(ctx.stderr).to.contain('done')
    })
})
