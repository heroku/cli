import {expect, test} from '@oclif/test'

describe('webhooks:update', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .patch('/apps/example-app/webhooks/99999999-9999-9999-9999-999999999999', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com',
      })
      .reply(200, {}),
    )
    .command([
      'webhooks:update',
      '--app',
      'example-app',
      '--include',
      'foo,bar',
      '--secret',
      '1234',
      '--level',
      'notify',
      '--url',
      'http://foobar.com',
      '99999999-9999-9999-9999-999999999999',
    ])
    .it('updates app webhooks', ctx => {
      expect(ctx.stdout).to.equal('')
      expect(ctx.stderr).to.contain('Updating webhook 99999999-9999-9999-9999-999999999999 for example-app... done\n')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .patch('/pipelines/example-pipeline/webhooks/99999999-9999-9999-9999-999999999999', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com',
      })
      .reply(200, {}),
    )
    .command([
      'webhooks:update',
      '--pipeline',
      'example-pipeline',
      '--include',
      'foo,bar',
      '--secret',
      '1234',
      '--level',
      'notify',
      '--url',
      'http://foobar.com',
      '99999999-9999-9999-9999-999999999999',
    ])
    .it('updates pipelines webhooks', ctx => {
      expect(ctx.stdout).to.equal('')
      expect(ctx.stderr).to.contain('Updating webhook 99999999-9999-9999-9999-999999999999 for example-pipeline... done\n')
    })
})
