import { expect, test } from '@oclif/test'

describe('webhooks:deliveries:info', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .get('/apps/example-app/webhook-deliveries/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        event: {
          id: '88888888-8888-8888-8888-888888888888'
        },
        webhook: {
          id: '77777777-7777-7777-7777-777777777777'
        },
        status: 'pending'
      })
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
            foo: 'bar'
          }
        }
      })
    )
    .command([
      'webhooks:deliveries:info',
      '--app', 'example-app',
      '99999999-9999-9999-9999-999999999999'
    ])
    .it('shows an app webhook delivery', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== 99999999-9999-9999-9999-999999999999
Event:        88888888-8888-8888-8888-888888888888
Status:       pending
Webhook:      77777777-7777-7777-7777-777777777777
=== Event Payload
{
  "published_at": "2016-08-31T21:55:06Z",
  "resource": "api:release",
  "action": "create",
  "data": {
    "foo": "bar"
  }
}
`)
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .get('/pipelines/example-pipeline/webhook-deliveries/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        event: {
          id: '88888888-8888-8888-8888-888888888888'
        },
        webhook: {
          id: '77777777-7777-7777-7777-777777777777'
        },
        status: 'pending'
      })
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
            foo: 'bar'
          }
        }
      })
    )
    .command([
      'webhooks:deliveries:info',
      '--pipeline', 'example-pipeline',
      '99999999-9999-9999-9999-999999999999'
    ])
    .it('shows a pipeline webhook delivery ', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== 99999999-9999-9999-9999-999999999999
Event:        88888888-8888-8888-8888-888888888888
Status:       pending
Webhook:      77777777-7777-7777-7777-777777777777
=== Event Payload
{
  "published_at": "2016-08-31T21:55:06Z",
  "resource": "api:release",
  "action": "create",
  "data": {
    "foo": "bar"
  }
}
`)
    })
})
