import {expect, test} from '@oclif/test'
import {addDays} from 'date-fns'

describe('webhooks:events', function () {
  const deprecationWarning = 'Warning: heroku webhooks:event is deprecated, please use heroku'
  const deprecationWarning2 = 'webhooks:deliveries'

  describe('app webhooks', function () {
    const appWebhookEventsPath = '/apps/example-app/webhook-events'

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
            action: 'create',
          },
        }]),
      )
      .command(['webhooks:events', '--app', 'example-app'])
      .it('lists app webhook events', ctx => {
        expect(ctx.stderr).to.include(deprecationWarning)
        expect(ctx.stderr).to.include(deprecationWarning2)
        expect(ctx.stdout).to.contain('Event ID                             Resource    Action Published At')
        expect(ctx.stdout).to.contain('99999999-9999-9999-9999-999999999999 api:release create 2016-08-31T21:55:06Z')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(appWebhookEventsPath)
        .reply(200, []),
      )
      .command(['webhooks:events', '--app', 'example-app'])
      .it('displays an empty events message', ctx => {
        expect(ctx.stderr).to.include(deprecationWarning)
        expect(ctx.stderr).to.include(deprecationWarning2)
        expect(ctx.stdout).to.equal('⬢ example-app has no events\n')
      })
  })

  describe('pipeline webhooks', function () {
    const pipelineWebhookEventsPath = '/pipelines/example-pipeline/webhook-events'

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
            action: 'create',
          },
        }]),
      )
      .command(['webhooks:events', '--pipeline', 'example-pipeline'])
      .it('lists pipeline webhook events', ctx => {
        expect(ctx.stderr).to.include(deprecationWarning)
        expect(ctx.stderr).to.include(deprecationWarning2)
        expect(ctx.stdout).to.contain('Event ID                             Resource    Action Published At')
        expect(ctx.stdout).to.contain('99999999-9999-9999-9999-999999999999 api:release create 2016-08-31T21:55:06Z')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(pipelineWebhookEventsPath)
        .reply(200, []),
      )
      .command(['webhooks:events', '--pipeline', 'example-pipeline'])
      .it('displays an empty events message', ctx => {
        expect(ctx.stderr).to.include(deprecationWarning)
        expect(ctx.stderr).to.include(deprecationWarning2)
        expect(ctx.stdout).to.equal('example-pipeline has no events\n')
      })
  })

  describe('by default the table is sorted by "created_at"', function () {
    const firstDate = new Date('2019-06-11T14:20:42Z')
    const secondDate = addDays(new Date(firstDate), 1)
    const thirdDate = addDays(new Date(firstDate), 2)

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get('/apps/example-app/webhook-events')
        .reply(200, [
          // the returned ordered from the api is not ordered by
          // "created_at" but the results displayed by the cli
          // in thae table *are* ordered by "created_at"

          // first date
          {
            id: '00000000-0000-0000-0000-000000000000',
            created_at: firstDate.toISOString(),
            payload: {
              published_at: '2019-06-15T14:20:42Z',
              resource: 'api:release',
              action: 'create',
            },
          },

          // third date
          {
            id: '11111111-1111-1111-1111-111111111111',
            created_at: thirdDate.toISOString(),
            payload: {
              published_at: '2019-06-15T14:20:42Z',
              resource: 'api:release',
              action: 'create',
            },
          },

          // second date
          {
            id: '22222222-2222-2222-2222-222222222222',
            created_at: secondDate.toISOString(),
            payload: {
              published_at: '2019-06-15T14:20:42Z',
              resource: 'api:release',
              action: 'create',
            },
          },
        ]),
      )
      .command(['webhooks:events', '--app', 'example-app'])
      .it('displays webhooks sorted by "created_at"', ctx => {
        expect(ctx.stderr).to.include(deprecationWarning)
        expect(ctx.stderr).to.include(deprecationWarning2)
        // Note: The table is sorted by "created_at" date even though
        // it is not displayed in the table
        expect(ctx.stdout).to.contain('Event ID                             Resource    Action Published At')
        expect(ctx.stdout).to.contain('00000000-0000-0000-0000-000000000000 api:release create 2019-06-15T14:20:42Z')
        expect(ctx.stdout).to.contain('22222222-2222-2222-2222-222222222222 api:release create 2019-06-15T14:20:42Z')
        expect(ctx.stdout).to.contain('11111111-1111-1111-1111-111111111111 api:release create 2019-06-15T14:20:42Z')
      })
  })
})
