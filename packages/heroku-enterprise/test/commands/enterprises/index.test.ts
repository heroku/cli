import {expect, test} from '@oclif/test'

describe('enterprise', () => {
  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts')
      .reply(200, [{name: 'heroku'}])
    )
    .command(['enterprise'])
    .it('lists enterprise', ctx => {
      expect(ctx.stdout).to.contain('heroku')
    })

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts')
      .reply(200, [])
    )
    .command(['enterprise'])
    .it('warns there are no enterprise accounts to list', ctx => {
      expect(ctx.stderr).to.contain('No enterprise accounts to list')
    })
})
