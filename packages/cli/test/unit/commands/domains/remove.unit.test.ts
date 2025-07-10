import {expect, test} from '@oclif/test'

describe('domains:remove', function () {
  test
    .stderr()
    .nock('https://api.heroku.com', api => api
      .delete('/apps/myapp/domains/example.com')
      .reply(200, {}),
    )
    .command(['domains:remove', 'example.com', '--app', 'myapp'])
    .it('removes a single domain provided by an argument', ctx => {
      expect(ctx.stderr).to.contain('Removing example.com from ⬢ myapp... done')
    })
})
