import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import normalizeTableOutput from '../../../../helpers/utils/normalizeTableOutput.js'

describe('webhooks:deliveries', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  describe('app webhooks', function () {
    it('lists webhooks deliveries for app webhooks', async function () {
      api
        .matchHeader('range', 'seq ..; order=desc,max=1000')
        .get('/apps/example-app/webhook-deliveries')
        .reply(206, [
          {
            id: '66666666-6666-6666-6666-666666666666',
            event: {
              id: '55555555-5555-5555-5555-555555555555',
              include: 'api:build',
            },
            webhook: {
              id: '44444444-4444-4444-4444-444444444444',
              level: 'notify',
            },
            status: 'pending',
            num_attempts: 4,
            created_at: '2017-08-17T20:22:38Z',
          },
          {
            id: '99999999-9999-9999-9999-999999999999',
            event: {
              id: '88888888-8888-8888-8888-888888888888',
              include: 'api:build',
            },
            webhook: {
              id: '77777777-7777-7777-7777-777777777777',
              level: 'notify',
            },
            last_attempt: {
              code: 401,
              error_class: 'Foobar',
            },
            status: 'retrying',
            num_attempts: 4,
            created_at: '2017-08-17T20:22:37Z',
            next_attempt_at: '2017-08-17T20:22:39Z',
          },
        ])

      const {stderr, stdout} = await runCommand(['webhooks:deliveries', '--app', 'example-app'])

      expect(normalizeTableOutput(stdout)).to.equal(normalizeTableOutput(`
        Delivery ID                          Created              Status   Include   Level  Attempts Code Error  Next Attempt
        99999999-9999-9999-9999-999999999999 2017-08-17T20:22:37Z retrying api:build notify 4        401  Foobar 2017-08-17T20:22:39Z
        66666666-6666-6666-6666-666666666666 2017-08-17T20:22:38Z pending  api:build notify 4
      `))
    })

    it('lists webhook deliveries for app webhooks filtered by status', async function () {
      api
        .matchHeader('range', 'seq ..; order=desc,max=1000')
        .get('/apps/example-app/webhook-deliveries?eq[status]=pending')
        .reply(206, [
          {
            id: '66666666-6666-6666-6666-666666666666',
            event: {
              id: '55555555-5555-5555-5555-555555555555',
              include: 'api:build',
            },
            webhook: {
              id: '44444444-4444-4444-4444-444444444444',
              level: 'notify',
            },
            status: 'pending',
            num_attempts: 4,
            created_at: '2017-08-17T20:22:38Z',
          },
        ])

      const {stderr, stdout} = await runCommand(['webhooks:deliveries', '--app', 'example-app', '--status', 'pending'])

      expect(normalizeTableOutput(stdout)).to.equal(normalizeTableOutput(`
        Delivery ID                          Created              Status   Include   Level  Attempts Code Error  Next Attempt
        66666666-6666-6666-6666-666666666666 2017-08-17T20:22:38Z pending  api:build notify 4
      `))
    })

    it('only shows 1000 webhook deliveries', async function () {
      const delivery = {
        id: '66666666-6666-6666-6666-666666666666',
        event: {
          id: '55555555-5555-5555-5555-555555555555',
          include: 'api:build',
        },
        webhook: {
          id: '44444444-4444-4444-4444-444444444444',
          level: 'notify',
        },
        status: 'pending',
        num_attempts: 4,
        created_at: '2017-08-17T20:22:38Z',
      }

      api
        .matchHeader('range', 'seq ..; order=desc,max=1000')
        .get('/apps/example-app/webhook-deliveries')
        .reply(206, new Array(1000).fill(delivery)) // eslint-disable-line unicorn/no-new-array

      const {stderr, stdout} = await runCommand(['webhooks:deliveries', '--app', 'example-app'])

      const actualRows = normalizeTableOutput(stdout).split('\n')
      const expectedRows = normalizeTableOutput(`
        Delivery ID                          Created              Status  Include   Level  Attempts Code Error Next Attempt
        66666666-6666-6666-6666-666666666666 2017-08-17T20:22:38Z pending api:build notify 4
      `).split('\n')

      const angleBrackets = process.platform === 'win32' ? '»' : '›'

      const headerRowCount = 1
      const dataRowsCount = 1000
      expect(actualRows.length).to.equal(headerRowCount + dataRowsCount)

      expect(actualRows[0]).to.equal(expectedRows[0])
      expect(actualRows[1]).to.equal(expectedRows[1])

      expect(stderr).to.include(` ${angleBrackets}   Warning: Only showing the 1000 most recent deliveries\n ${angleBrackets}   Warning: It is possible to filter deliveries by using the --status flag\n`)
    })

    it('lists empty deliveries', async function () {
      api
        .matchHeader('range', 'seq ..; order=desc,max=1000')
        .get('/apps/example-app/webhook-deliveries')
        .reply(200, [])

      const {stderr, stdout} = await runCommand(['webhooks:deliveries', '--app', 'example-app'])

      expect(stderr).to.equal('')
      expect(stdout.trim()).to.equal('⬢ example-app has no deliveries')
    })
  })

  describe('pipeline webhooks', function () {
    it('lists webhooks deliveries for pipeline webhooks', async function () {
      api
        .matchHeader('range', 'seq ..; order=desc,max=1000')
        .get('/pipelines/example-pipeline/webhook-deliveries')
        .reply(206, [
          {
            id: '66666666-6666-6666-6666-666666666666',
            event: {
              id: '55555555-5555-5555-5555-555555555555',
              include: 'api:build',
            },
            webhook: {
              id: '44444444-4444-4444-4444-444444444444',
              level: 'notify',
            },
            status: 'pending',
            num_attempts: 4,
            created_at: '2017-08-17T20:22:38Z',
          },
          {
            id: '99999999-9999-9999-9999-999999999999',
            event: {
              id: '88888888-8888-8888-8888-888888888888',
              include: 'api:build',
            },
            webhook: {
              id: '77777777-7777-7777-7777-777777777777',
              level: 'notify',
            },
            last_attempt: {
              code: 401,
              error_class: 'Foobar',
            },
            status: 'retrying',
            num_attempts: 4,
            created_at: '2017-08-17T20:22:37Z',
            next_attempt_at: '2017-08-17T20:22:39Z',
          },
        ])

      const {stderr, stdout} = await runCommand(['webhooks:deliveries', '--pipeline', 'example-pipeline'])

      expect(normalizeTableOutput(stdout)).to.equal(normalizeTableOutput(`
        Delivery ID                          Created              Status   Include   Level  Attempts Code Error  Next Attempt
        99999999-9999-9999-9999-999999999999 2017-08-17T20:22:37Z retrying api:build notify 4        401  Foobar 2017-08-17T20:22:39Z
        66666666-6666-6666-6666-666666666666 2017-08-17T20:22:38Z pending  api:build notify 4
      `))
    })

    it('lists empty webhooks deliveries for pipeline webhooks', async function () {
      api
        .matchHeader('range', 'seq ..; order=desc,max=1000')
        .get('/pipelines/example-pipeline/webhook-deliveries')
        .reply(200, [])

      const {stderr, stdout} = await runCommand(['webhooks:deliveries', '--pipeline', 'example-pipeline'])

      expect(stderr).to.equal('')
      expect(stdout.trim()).to.equal('example-pipeline has no deliveries')
    })
  })
})
