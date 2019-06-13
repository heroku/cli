import {expect, test} from '@oclif/test'

describe('webhooks:events', () => {
  describe('app webhooks', () => {
    let appWebhookEventsPath = '/apps/example-app/webhook-events'

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(appWebhookEventsPath)
        .reply(200, [{
          id: '99999999-9999-9999-9999-999999999999',
          payload: {
            published_at: '2016-08-31T21:55:06Z',
            resource: 'api:release',
            action: 'create'
          }
        }])
      )
      .command(['webhooks:events', '--app', 'example-app'])
      .it('lists app webhook events', ctx => {
        expect(ctx.stderr).to.equal(' ›   Warning: heroku webhooks:event is deprecated, please use heroku webhooks:deliveries\n')
        expect(ctx.stdout).to.equal(`Event ID                             Resource    Action Published At         
99999999-9999-9999-9999-999999999999 api:release create 2016-08-31T21:55:06Z 
`)
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(appWebhookEventsPath)
        .reply(200, [])
      )
      .command(['webhooks:events', '--app', 'example-app'])
      .it('displays an empty events message', ctx => {
        expect(ctx.stderr).to.equal(' ›   Warning: heroku webhooks:event is deprecated, please use heroku webhooks:deliveries\n')
        expect(ctx.stdout).to.equal('⬢ example-app has no events\n')
      })
  })

  describe('pipeline webhooks', () => {
    let pipelineWebhookEventsPath = '/pipelines/example-pipeline/webhook-events'

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(pipelineWebhookEventsPath)
        .reply(200, [{
          id: '99999999-9999-9999-9999-999999999999',
          payload: {
            published_at: '2016-08-31T21:55:06Z',
            resource: 'api:release',
            action: 'create'
          }
        }])
      )
      .command(['webhooks:events', '--pipeline', 'example-pipeline'])
      .it('lists pipeline webhook events', ctx => {
        expect(ctx.stderr).to.equal(' ›   Warning: heroku webhooks:event is deprecated, please use heroku webhooks:deliveries\n')
        expect(ctx.stdout).to.equal(`Event ID                             Resource    Action Published At         
99999999-9999-9999-9999-999999999999 api:release create 2016-08-31T21:55:06Z 
`)
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(pipelineWebhookEventsPath)
        .reply(200, [])
      )
      .command(['webhooks:events', '--pipeline', 'example-pipeline'])
      .it('displays an empty events message', ctx => {
        expect(ctx.stderr).to.equal(' ›   Warning: heroku webhooks:event is deprecated, please use heroku webhooks:deliveries\n')
        expect(ctx.stdout).to.equal('example-pipeline has no events\n')
      })
  })
})
