/* eslint-disable camelcase */
'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../../commands/webhooks/events')

describe('heroku webhooks:events', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('# lists events', function () {
    let mock = nock('https://api.heroku.com')
    .get('/apps/example/webhook-events')
    .reply(200, [{
      id: '99999999-9999-9999-9999-999999999999',
      payload: {
        published_at: '2016-08-31T21:55:06Z',
        resource: 'api:release',
        action: 'create',
      },

    }])

    return certs.run(['--app', 'example']).then(function () {
      mock.done()
      expect(cli.stderr).to.equal(' ▸    heroku webhooks:event is deprecated, please use heroku webhooks:deliveries\n')
      expect(cli.stdout).to.equal(
        `Event ID                              Resource     Action  Published At
────────────────────────────────────  ───────────  ──────  ────────────────────
99999999-9999-9999-9999-999999999999  api:release  create  2016-08-31T21:55:06Z
`)
    })
  })

  it('# lists events (pipelines)', function () {
    let mock = nock('https://api.heroku.com')
    .get('/pipelines/example/webhook-events')
    .reply(200, [{
      id: '99999999-9999-9999-9999-999999999999',
      payload: {
        published_at: '2016-08-31T21:55:06Z',
        resource: 'api:release',
        action: 'create',
      },

    }])

    return certs.run(['--pipeline', 'example']).then(function () {
      mock.done()
      expect(cli.stderr).to.equal(' ▸    heroku webhooks:event is deprecated, please use heroku webhooks:deliveries\n')
      expect(cli.stdout).to.equal(
        `Event ID                              Resource     Action  Published At
────────────────────────────────────  ───────────  ──────  ────────────────────
99999999-9999-9999-9999-999999999999  api:release  create  2016-08-31T21:55:06Z
`)
    })
  })

  it('# lists empty events', function () {
    let mock = nock('https://api.heroku.com')
    .get('/apps/example/webhook-events')
    .reply(200, [])

    return certs.run(['--app', 'example']).then(function () {
      mock.done()
      expect(cli.stderr).to.equal(' ▸    heroku webhooks:event is deprecated, please use heroku webhooks:deliveries\n')
      expect(cli.stdout).to.equal('example has no events\n')
    })
  })

  it('# lists empty events (pipelines)', function () {
    let mock = nock('https://api.heroku.com')
    .get('/pipelines/example/webhook-events')
    .reply(200, [])

    return certs.run(['--pipeline', 'example']).then(function () {
      mock.done()
      expect(cli.stderr).to.equal(' ▸    heroku webhooks:event is deprecated, please use heroku webhooks:deliveries\n')
      expect(cli.stdout).to.equal('example has no events\n')
    })
  })
})
