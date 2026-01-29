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

    it('lists webhooks', async function () {
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
      expect(stdout).to.contain('Webhook ID')
      expect(stdout).to.contain('URL')
      expect(stdout).to.contain('Include')
      expect(stdout).to.contain('Level')
      expect(stdout).to.contain('99999999-9999-9999-9999-999999999999')
      expect(stdout).to.contain('http://foobar.com')
      expect(stdout).to.contain('foo,bar')
      expect(stdout).to.contain('notify')
    })

    it('displays a "no webhooks" message', async function () {
      api
        .get(appWebhooksUrl)
        .reply(200, [])

      const {stderr, stdout} = await runCommand(['webhooks', '--app', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.contain('example has no webhooks')
      expect(stdout).to.contain('heroku webhooks:add')
    })
  })

  describe('pipeline webhooks', function () {
    const pipelinesWebhooksUrl = '/pipelines/example/webhooks'

    it('lists webhooks', async function () {
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
      expect(stdout).to.contain('Webhook ID')
      expect(stdout).to.contain('URL')
      expect(stdout).to.contain('Include')
      expect(stdout).to.contain('Level')
      expect(stdout).to.contain('99999999-9999-9999-9999-999999999999')
      expect(stdout).to.contain('http://foobar.com')
      expect(stdout).to.contain('foo,bar')
      expect(stdout).to.contain('notify')
    })

    it('displays a "no webhooks" message', async function () {
      api
        .get(pipelinesWebhooksUrl)
        .reply(200, [])

      const {stderr, stdout} = await runCommand(['webhooks', '--pipeline', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.contain('example has no webhooks')
      expect(stdout).to.contain('heroku webhooks:add')
    })
  })

  describe('by default the table is sorted by "created_at"', function () {
    const firstDate = new Date('2019-06-11T14:20:42Z')
    const secondDate = addDays(new Date(firstDate), 1)
    const thirdDate = addDays(new Date(firstDate), 2)

    it('displays webhooks sorted by "created_at"', async function () {
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
      expect(stdout).to.contain('Webhook ID')
      expect(stdout).to.contain('00000000-0000-0000-0000-000000000000')
      expect(stdout).to.contain('22222222-2222-2222-2222-222222222222')
      expect(stdout).to.contain('11111111-1111-1111-1111-111111111111')
      expect(stdout).to.contain('https://test.com/hook')
      expect(stdout).to.contain('api:release')
      expect(stdout).to.contain('sync')
    })
  })
})
