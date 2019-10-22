import {expect, test} from '../../test'

describe('domains:wait', () => {
  test
    .stderr()
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/domains/example.com')
      .reply(200, {id: 123, hostname: 'example.com', status: 'succeeded'})
    )
    .command(['domains:wait', 'example.com', '--app', 'myapp'])
    .it('removes a single domain provided by an argument', ctx => {
      expect(ctx.stderr).to.contain('Waiting for example.com... done')
    })
})
