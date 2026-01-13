import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {addDays} from 'date-fns'
import nock from 'nock'

describe('webhooks:index', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  describe('app webhooks', function () {
    const appWebhooksUrl = '/apps/example/webhooks'

    it.skip('lists webhooks', async function () {
      api
        .get(appWebhooksUrl)
        .reply(200, [{
          id: '99999999-9999-9999-9999-999999999999',
          include: ['foo', 'bar'],
          level: 'notify',
          url: 'http://foobar.com',
        }])

      const {stderr, stdout} = await runCommand(['webhooks', '--app', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.contain('Webhook ID                           URL               Include Level')
      expect(stdout).to.contain('99999999-9999-9999-9999-999999999999 http://foobar.com foo,bar notify')
    })

    it.skip('displays a "no webhooks" message', async function () {
      api
        .get(appWebhooksUrl)
        .reply(200, [])

      const {stderr, stdout} = await runCommand(['webhooks', '--app', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('⬢ example has no webhooks\nUse heroku webhooks:add to add one.\n')
    })
  })

  describe('pipeline webhooks', function () {
    const pipelinesWebhooksUrl = '/pipelines/example/webhooks'

    it.skip('lists webhooks', async function () {
      api
        .get(pipelinesWebhooksUrl)
        .reply(200, [{
          id: '99999999-9999-9999-9999-999999999999',
          include: ['foo', 'bar'],
          level: 'notify',
          url: 'http://foobar.com',
        }])

      const {stderr, stdout} = await runCommand(['webhooks', '--pipeline', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.contain('Webhook ID                           URL               Include Level')
      expect(stdout).to.contain('99999999-9999-9999-9999-999999999999 http://foobar.com foo,bar notify')
    })

    it.skip('displays a "no webhooks" message', async function () {
      api
        .get(pipelinesWebhooksUrl)
        .reply(200, [])

      const {stderr, stdout} = await runCommand(['webhooks', '--pipeline', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('example has no webhooks\nUse heroku webhooks:add to add one.\n')
    })
  })

  describe('by default the table is sorted by "created_at"', function () {
    const firstDate = new Date('2019-06-11T14:20:42Z')
    const secondDate = addDays(new Date(firstDate), 1)
    const thirdDate = addDays(new Date(firstDate), 2)

    it.skip('displays webhooks sorted by "created_at"', async function () {
      api
        .get('/apps/example/webhooks')
        .reply(200, [
          // the returned ordered from the api is not ordered by
          // "created_at" but the results displayed by the cli
          // in the table *are* ordered by "created_at"

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
        ])

      const {stderr, stdout} = await runCommand(['webhooks', '--app', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.contain('Webhook ID                           URL                   Include     Level')
      expect(stdout).to.contain('00000000-0000-0000-0000-000000000000 https://test.com/hook api:release sync')
      expect(stdout).to.contain('22222222-2222-2222-2222-222222222222 https://test.com/hook api:release sync')
      expect(stdout).to.contain('11111111-1111-1111-1111-111111111111 https://test.com/hook api:release sync')
    })
  })
})
