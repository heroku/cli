import {expect, test} from '@oclif/test'

describe('webhooks:remove', () => {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com', api => api
      .delete('/apps/example-app/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {}),
    )
    .command(['webhooks:remove', '--app', 'example-app', '99999999-9999-9999-9999-999999999999'])
    .it('removes the specified app webhook', ctx => {
      expect(ctx.stdout).to.equal('')
      expect(ctx.stderr).to.contain('Removing webhook 99999999-9999-9999-9999-999999999999 from example-app... done\n')
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com', api => api
      .delete('/pipelines/example-pipeline/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {}),
    )
    .command(['webhooks:remove', '--pipeline', 'example-pipeline', '99999999-9999-9999-9999-999999999999'])
    .it('removes the specified pipeline webhook', ctx => {
      expect(ctx.stdout).to.equal('')
      expect(ctx.stderr).to.contain('Removing webhook 99999999-9999-9999-9999-999999999999 from example-pipeline... done\n')
    })
})
