import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('webhooks:events:info', function () {
  let api: nock.Scope
  const deprecationWarning = 'Warning: heroku webhooks:event:info is deprecated, please use heroku'
  const deprecationWarning2 = 'webhooks:deliveries:info'

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it.skip('lists webhooks events info for app webhooks', async function () {
    api
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
      })

    const {stderr, stdout} = await runCommand([
      'webhooks:events:info',
      '--app',
      'example-app',
      '99999999-9999-9999-9999-999999999999',
    ])

    expect(stderr).to.include(deprecationWarning)
    expect(stderr).to.include(deprecationWarning2)
    expect(stdout).to.contain('=== 99999999-9999-9999-9999-999999999999')
    expect(stdout).to.contain('payload: {')
    expect(stdout).to.contain('"published_at": "2016-08-31T21:55:06Z",')
    expect(stdout).to.contain('"resource": "api:release",')
    expect(stdout).to.contain('"action": "create",')
    expect(stdout).to.contain('"data": {')
    expect(stdout).to.contain('"foo": "bar"')
  })

  it.skip('lists webhooks events info for pipeline webhooks', async function () {
    api
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
      })

    const {stderr, stdout} = await runCommand([
      'webhooks:events:info',
      '--pipeline',
      'example-pipeline',
      '99999999-9999-9999-9999-999999999999',
    ])

    expect(stderr).to.include(deprecationWarning)
    expect(stderr).to.include(deprecationWarning2)
    expect(stdout).to.contain('=== 99999999-9999-9999-9999-999999999999')
    expect(stdout).to.contain('payload: {')
    expect(stdout).to.contain('"published_at": "2016-08-31T21:55:06Z",')
    expect(stdout).to.contain('"resource": "api:release",')
    expect(stdout).to.contain('"action": "create",')
    expect(stdout).to.contain('"data": {')
    expect(stdout).to.contain('"foo": "bar"')
  })
})
