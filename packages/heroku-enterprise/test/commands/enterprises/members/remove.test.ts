import {expect, test} from '@oclif/test'

describe('enterprise:members:remove', () => {
  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .delete('/enterprise-accounts/acme/members/thomas.delete@whynot.com')
      .reply(200)
    )
    .command(['enterprise:members:remove', 'thomas.delete@whynot.com', '--enterprise-account', 'acme'])
    .it('removes a member of an enterprise account', ctx => {
      expect(ctx.stderr).to.contain('Removing thomas.delete@whynot.com from acme... done')
    })
})
