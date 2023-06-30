import {expect, test} from '@oclif/test'

describe('domains:clear', () => {
  test
    .stderr()
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/domains')
      .reply(200, [{hostname: 'example.com', kind: 'custom'}]),
    )
    .nock('https://api.heroku.com', api => api
      .delete('/apps/myapp/domains/example.com')
      .reply(200, {}),
    )
    .command(['domains:clear', '--app', 'myapp'])
    .it('clears domains all domains', ctx => {
      expect(ctx.stderr).to.contain('Removing all domains from ⬢ myapp... done')
    })
})
