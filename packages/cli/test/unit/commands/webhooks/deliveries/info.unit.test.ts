import {expect, test} from '@oclif/test'

describe('webhooks:deliveries:info', function () {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .get('/apps/example-app/webhook-deliveries/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        event: {
          id: '88888888-8888-8888-8888-888888888888',
        },
        webhook: {
          id: '77777777-7777-7777-7777-777777777777',
        },
        status: 'pending',
      }),
    )
    .nock('https://api.heroku.com', api => api
      .get('/apps/example-app/webhook-events/88888888-8888-8888-8888-888888888888')
      .reply(200, {
        id: '88888888-8888-8888-8888-888888888888',
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
      'webhooks:deliveries:info',
      '--app',
      'example-app',
      '99999999-9999-9999-9999-999999999999',
    ])
    .it('shows an app webhook delivery', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.contain('=== 99999999-9999-9999-9999-999999999999')
      expect(ctx.stdout).to.contain('Event:        88888888-8888-8888-8888-888888888888')
      expect(ctx.stdout).to.contain('Status:       pending')
      expect(ctx.stdout).to.contain('Webhook:      77777777-7777-7777-7777-777777777777')
      expect(ctx.stdout).to.contain('=== Event Payload')
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
      .get('/pipelines/example-pipeline/webhook-deliveries/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        event: {
          id: '88888888-8888-8888-8888-888888888888',
        },
        webhook: {
          id: '77777777-7777-7777-7777-777777777777',
        },
        status: 'pending',
      }),
    )
    .nock('https://api.heroku.com', api => api
      .get('/pipelines/example-pipeline/webhook-events/88888888-8888-8888-8888-888888888888')
      .reply(200, {
        id: '88888888-8888-8888-8888-888888888888',
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
      'webhooks:deliveries:info',
      '--pipeline',
      'example-pipeline',
      '99999999-9999-9999-9999-999999999999',
    ])
    .it('shows a pipeline webhook delivery ', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.contain('=== 99999999-9999-9999-9999-999999999999')
      expect(ctx.stdout).to.contain('Event:        88888888-8888-8888-8888-888888888888')
      expect(ctx.stdout).to.contain('Status:       pending')
      expect(ctx.stdout).to.contain('Webhook:      77777777-7777-7777-7777-777777777777')
      expect(ctx.stdout).to.contain('=== Event Payload')
      expect(ctx.stdout).to.contain('"published_at": "2016-08-31T21:55:06Z",')
      expect(ctx.stdout).to.contain('"resource": "api:release",')
      expect(ctx.stdout).to.contain('"action": "create",')
      expect(ctx.stdout).to.contain('"data": {')
      expect(ctx.stdout).to.contain('"foo": "bar"')
    })
})
