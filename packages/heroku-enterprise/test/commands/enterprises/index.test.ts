import {expect, test} from '@oclif/test'

describe('enterprises', () => {
  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts')
      .reply(200, [{name: 'heroku'}])
    )
    .command(['enterprises'])
    .it('lists enterprises', ctx => {
      expect(ctx.stdout).to.contain('heroku')
    })

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts')
      .reply(200, [])
    )
    .command(['enterprises'])
    .it('warns there are no enterprise accounts to list', ctx => {
      expect(ctx.stderr).to.contain('No enterprise accounts to list')
    })
})
