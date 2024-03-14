import {expect, test} from '@oclif/test'

describe('webhooks:events:info', () => {
  const deprecationWarning = 'Warning: heroku webhooks:event:info is deprecated, please use heroku'
  const deprecationWarning2 = 'webhooks:deliveries:info'

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .get('/apps/example-app/webhook-events/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        payload: {
          published_at: '2016-08-31T21:55:06Z',
          resource: 'api:release',
          action: 'create',
          data: {
            foo: 'bar',
          },
        },
      }),
    )
    .command([
      'webhooks:events:info',
      '--app',
      'example-app',
      '99999999-9999-9999-9999-999999999999',
    ])
    .it('lists webhooks events info for app webhooks', ctx => {
      expect(ctx.stderr).to.include(deprecationWarning)
      expect(ctx.stderr).to.include(deprecationWarning2)
      expect(ctx.stdout).to.contain('=== 99999999-9999-9999-9999-999999999999')
      expect(ctx.stdout).to.contain('payload: {')
      expect(ctx.stdout).to.contain('"published_at": "2016-08-31T21:55:06Z",')
      expect(ctx.stdout).to.contain('"resource": "api:release",')
      expect(ctx.stdout).to.contain('"action": "create",')
      expect(ctx.stdout).to.contain('"data": {')
      expect(ctx.stdout).to.contain('"foo": "bar"')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .get('/pipelines/example-pipeline/webhook-events/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        payload: {
          published_at: '2016-08-31T21:55:06Z',
          resource: 'api:release',
          action: 'create',
          data: {
            foo: 'bar',
          },
        },
      }),
    )
    .command([
      'webhooks:events:info',
      '--pipeline',
      'example-pipeline',
      '99999999-9999-9999-9999-999999999999',
    ])
    .it('lists webhooks events info for pipeline webhooks', ctx => {
      expect(ctx.stderr).to.include(deprecationWarning)
      expect(ctx.stderr).to.include(deprecationWarning2)
      expect(ctx.stdout).to.contain('=== 99999999-9999-9999-9999-999999999999')
      expect(ctx.stdout).to.contain('payload: {')
      expect(ctx.stdout).to.contain('"published_at": "2016-08-31T21:55:06Z",')
      expect(ctx.stdout).to.contain('"resource": "api:release",')
      expect(ctx.stdout).to.contain('"action": "create",')
      expect(ctx.stdout).to.contain('"data": {')
      expect(ctx.stdout).to.contain('"foo": "bar"')
    })
})
