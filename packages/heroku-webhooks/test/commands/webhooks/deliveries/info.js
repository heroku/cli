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
    let mock = nock('https://api.heroku.com')
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

    return certs.run({app: 'example', args: {id: '99999999-9999-9999-9999-999999999999'}, flags: {}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
`=== 99999999-9999-9999-9999-999999999999
event:   88888888-8888-8888-8888-888888888888
status:  pending
webhook: 77777777-7777-7777-7777-777777777777
`)
    })
  })
})
