import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('webhooks:deliveries:info', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows an app webhook delivery', async function () {
    api
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
      })
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
      })

    const {stderr, stdout} = await runCommand([
      'webhooks:deliveries:info',
      '--app',
      'example-app',
      '99999999-9999-9999-9999-999999999999',
    ])

    expect(stderr).to.equal('')
    expect(stdout).to.contain('=== 99999999-9999-9999-9999-999999999999')
    expect(stdout).to.contain('Event:        88888888-8888-8888-8888-888888888888')
    expect(stdout).to.contain('Status:       pending')
    expect(stdout).to.contain('Webhook:      77777777-7777-7777-7777-777777777777')
    expect(stdout).to.contain('=== Event Payload')
    expect(stdout).to.contain('"published_at": "2016-08-31T21:55:06Z",')
    expect(stdout).to.contain('"resource": "api:release",')
    expect(stdout).to.contain('"action": "create",')
    expect(stdout).to.contain('"data": {')
    expect(stdout).to.contain('"foo": "bar"')
  })

  it('shows a pipeline webhook delivery ', async function () {
    api
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
      })
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
      })

    const {stderr, stdout} = await runCommand([
      'webhooks:deliveries:info',
      '--pipeline',
      'example-pipeline',
      '99999999-9999-9999-9999-999999999999',
    ])

    expect(stderr).to.equal('')
    expect(stdout).to.contain('=== 99999999-9999-9999-9999-999999999999')
    expect(stdout).to.contain('Event:        88888888-8888-8888-8888-888888888888')
    expect(stdout).to.contain('Status:       pending')
    expect(stdout).to.contain('Webhook:      77777777-7777-7777-7777-777777777777')
    expect(stdout).to.contain('=== Event Payload')
    expect(stdout).to.contain('"published_at": "2016-08-31T21:55:06Z",')
    expect(stdout).to.contain('"resource": "api:release",')
    expect(stdout).to.contain('"action": "create",')
    expect(stdout).to.contain('"data": {')
    expect(stdout).to.contain('"foo": "bar"')
  })
})
