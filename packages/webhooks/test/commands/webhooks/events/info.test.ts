import {expect, test} from '@oclif/test'

describe('webhooks:events:info', () => {
  const deprecationWarning = ' ›   Warning: heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info\n'

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
            foo: 'bar'
          }
        }
      })
    )
    .command([
      'webhooks:events:info',
      '--app', 'example-app',
      '99999999-9999-9999-9999-999999999999'
    ])
    .it('lists webhooks events info for app webhooks', ctx => {
      expect(ctx.stderr).to.equal(deprecationWarning)
      expect(ctx.stdout).to.equal(`=== 99999999-9999-9999-9999-999999999999
payload: {
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
      .get('/pipelines/example-pipeline/webhook-events/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
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
      'webhooks:events:info',
      '--pipeline', 'example-pipeline',
      '99999999-9999-9999-9999-999999999999'
    ])
    .it('lists webhooks events info for pipeline webhooks', ctx => {
      expect(ctx.stderr).to.equal(deprecationWarning)
      expect(ctx.stdout).to.equal(`=== 99999999-9999-9999-9999-999999999999
payload: {
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
