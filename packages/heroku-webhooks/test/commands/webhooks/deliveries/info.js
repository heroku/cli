'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../../commands/webhooks/deliveries/info')

describe('heroku webhooks:deliveries:info', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('# shows a delivery', function () {
    let mockDelivery = nock('https://api.heroku.com')
      .get('/apps/example/webhook-deliveries/99999999-9999-9999-9999-999999999999')
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

    let mockEvent = nock('https://api.heroku.com')
      .get('/apps/example/webhook-events/88888888-8888-8888-8888-888888888888')
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

    return certs.run({app: 'example', args: {id: '99999999-9999-9999-9999-999999999999'}, flags: {}}).then(function () {
      mockDelivery.done()
      mockEvent.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
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

  it('# shows a delivery', function () {
    let mockDelivery = nock('https://api.heroku.com')
      .get('/pipelines/example/webhook-deliveries/99999999-9999-9999-9999-999999999999')
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

    let mockEvent = nock('https://api.heroku.com')
      .get('/pipelines/example/webhook-events/88888888-8888-8888-8888-888888888888')
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

    return certs.run({args: {id: '99999999-9999-9999-9999-999999999999'}, flags: {pipeline: 'example'}}).then(function () {
      mockDelivery.done()
      mockEvent.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
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
})
