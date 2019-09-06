import {expect, test} from '@oclif/test'

describe('enterprise:teams:remove', () => {
  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .delete('/teams/team-marketing')
      .reply(200)
    )
    .command(['enterprise:teams:remove', 'team-marketing'])
    .it('deletes an existing team from an enterprise account', ctx => {
      expect(ctx.stderr).to.contain('Removing team-marketing... done')
    })
})
