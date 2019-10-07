import {expect, test} from '@oclif/test'

describe('webhooks:info', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .get('/apps/example-app/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        include: ['foo', 'bar'],
        level: 'notify',
        url: 'http://foobar.com'
      })
    )
    .command(['webhooks:info', '--app', 'example-app', '99999999-9999-9999-9999-999999999999'])
    .it('displays info for a given app webhook', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(`=== 99999999-9999-9999-9999-999999999999
Include:    foo,bar
Level:      notify
URL:        http://foobar.com
Webhook ID: 99999999-9999-9999-9999-999999999999
`)
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .get('/pipelines/example-pipeline/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        include: ['foo', 'bar'],
        level: 'notify',
        url: 'http://foobar.com'
      })
    )
    .command(['webhooks:info', '--pipeline', 'example-pipeline', '99999999-9999-9999-9999-999999999999'])
    .it('displays info for a given pipeline webhook', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(`=== 99999999-9999-9999-9999-999999999999
Include:    foo,bar
Level:      notify
URL:        http://foobar.com
Webhook ID: 99999999-9999-9999-9999-999999999999
`)
    })
})
