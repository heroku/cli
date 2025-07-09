import {expect, test} from '@oclif/test'

describe('domains:wait', function () {
  test
    .stderr()
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/domains/example.com')
      .reply(200, {id: 123, hostname: 'example.com', status: 'pending'}),
    )
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/domains/123')
      .reply(200, {id: 123, hostname: 'example.com', status: 'succeeded'}),
    )
    .command(['domains:wait', 'example.com', '--app', 'myapp'])
    .it('waits on domain status succeeded', ctx => {
      expect(ctx.stderr).to.contain('Waiting for example.com... done')
    })

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/apps/myapp/domains')
      .reply(200, [{id: 123, hostname: 'example.com', status: 'pending'}]),
    )
    .nock('https://api.heroku.com', (api: any) => api
      .get('/apps/myapp/domains/123')
      .reply(200, {id: 123, hostname: 'example.com', status: 'succeeded'}),
    )
    .command(['domains:wait', '--app', 'myapp'])
    .it('waits on domains when no hostname is provided', ctx => {
      expect(ctx.stderr).to.contain('Waiting for example.com... done')
    })
})
