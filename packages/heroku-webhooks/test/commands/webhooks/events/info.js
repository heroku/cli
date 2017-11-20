'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../../commands/webhooks/events/info')

describe('heroku webhooks:events:info', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('# shows an event', function () {
    let mock = nock('https://api.heroku.com')
      .get('/apps/example/webhook-events/99999999-9999-9999-9999-999999999999')
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

    return certs.run({app: 'example', args: {id: '99999999-9999-9999-9999-999999999999'}, flags: {}}).then(function () {
      mock.done()
      expect(cli.stderr.replace('\n ▸    ', ' ')).to.equal(' ▸    heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info\n')
      expect(cli.stdout).to.equal(
`=== 99999999-9999-9999-9999-999999999999
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

  it('# shows an event', function () {
    let mock = nock('https://api.heroku.com')
      .get('/pipelines/example/webhook-events/99999999-9999-9999-9999-999999999999')
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

    return certs.run({args: {id: '99999999-9999-9999-9999-999999999999'}, flags: {pipeline: 'example'}}).then(function () {
      mock.done()
      expect(cli.stderr.replace('\n ▸    ', ' ')).to.equal(' ▸    heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info\n')
      expect(cli.stdout).to.equal(
`=== 99999999-9999-9999-9999-999999999999
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
})
