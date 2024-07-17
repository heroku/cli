import {expect, test} from '@oclif/test'
import {addDays} from 'date-fns'

describe('webhooks:index', function () {
  describe('app webhooks', function () {
    const appWebhooksUrl = '/apps/example/webhooks'

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(appWebhooksUrl)
        .reply(200, [{
          id: '99999999-9999-9999-9999-999999999999',
          include: ['foo', 'bar'],
          level: 'notify',
          url: 'http://foobar.com',
        }]),
      )
      .command(['webhooks', '--app', 'example'])
      .it('lists webhooks', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.contain('Webhook ID                           URL               Include Level')
        expect(ctx.stdout).to.contain('99999999-9999-9999-9999-999999999999 http://foobar.com foo,bar notify')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(appWebhooksUrl)
        .reply(200, []),
      )
      .command(['webhooks', '--app', 'example'])
      .it('displays a "no webhooks" message', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal('⬢ example has no webhooks\nUse heroku webhooks:add to add one.\n')
      })
  })

  describe('pipeline webhooks', function () {
    const pipelinesWebhooksUrl = '/pipelines/example/webhooks'

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(pipelinesWebhooksUrl)
        .reply(200, [{
          id: '99999999-9999-9999-9999-999999999999',
          include: ['foo', 'bar'],
          level: 'notify',
          url: 'http://foobar.com',
        }]),
      )
      .command(['webhooks', '--pipeline', 'example'])
      .it('lists webhooks', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.contain('Webhook ID                           URL               Include Level')
        expect(ctx.stdout).to.contain('99999999-9999-9999-9999-999999999999 http://foobar.com foo,bar notify')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(pipelinesWebhooksUrl)
        .reply(200, []),
      )
      .command(['webhooks', '--pipeline', 'example'])
      .it('displays a "no webhooks" message', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal('example has no webhooks\nUse heroku webhooks:add to add one.\n')
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
        .get('/apps/example/webhooks')
        .reply(200, [
          // the returned ordered from the api is not ordered by
          // "created_at" but the results displayed by the cli
          // in thae table *are* ordered by "created_at"

          // first date
          {
            created_at: firstDate.toISOString(),
            id: '00000000-0000-0000-0000-000000000000',
            include: ['api:release'],
            level: 'sync',
            url: 'https://test.com/hook',
          },

          // third date
          {
            created_at: thirdDate.toISOString(),
            id: '11111111-1111-1111-1111-111111111111',
            include: ['api:release'],
            level: 'sync',
            url: 'https://test.com/hook',
          },

          // second date
          {
            created_at: secondDate.toISOString(),
            id: '22222222-2222-2222-2222-222222222222',
            include: ['api:release'],
            level: 'sync',
            url: 'https://test.com/hook',
          },
        ]),
      )
      .command(['webhooks', '--app', 'example'])
      .it('displays webhooks sorted by "created_at"', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.contain('Webhook ID                           URL                   Include     Level')
        expect(ctx.stdout).to.contain('00000000-0000-0000-0000-000000000000 https://test.com/hook api:release sync')
        expect(ctx.stdout).to.contain('22222222-2222-2222-2222-222222222222 https://test.com/hook api:release sync')
        expect(ctx.stdout).to.contain('11111111-1111-1111-1111-111111111111 https://test.com/hook api:release sync')
      })
  })
})
