'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../../commands/webhooks/deliveries/index')

describe('heroku webhooks:deliveries', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('# lists deliveries', function () {
    let mock = nock('https://api.heroku.com')
      .get('/apps/example/webhook-deliveries')
      .reply(200, [{
        id: '99999999-9999-9999-9999-999999999999',
        event: {
          id: '88888888-8888-8888-8888-888888888888'
        },
        webhook: {
          id: '77777777-7777-7777-7777-777777777777'
        },
        status: 'pending'
      }])

    return certs.run({app: 'example', args: {}, flags: {}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
`ID                                    Event                                 Webhook                               status
────────────────────────────────────  ────────────────────────────────────  ────────────────────────────────────  ───────
99999999-9999-9999-9999-999999999999  88888888-8888-8888-8888-888888888888  77777777-7777-7777-7777-777777777777  pending
`)
    })
  })

  it('# lists empty deliveries', function () {
    let mock = nock('https://api.heroku.com')
      .get('/apps/example/webhook-deliveries')
      .reply(200, [])

    return certs.run({app: 'example', args: {}, flags: {}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal('example has no deliveries\n')
    })
  })
})
