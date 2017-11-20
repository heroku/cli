'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let info = require('../../../commands/webhooks/info')

describe('heroku webhooks:deliveries:info', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('# shows a webhook', function () {
    let mock = nock('https://api.heroku.com')
      .get('/apps/example/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        include: ['foo', 'bar'],
        level: 'notify',
        url: 'http://foobar.com'
      })

    return info.run({app: 'example', args: {id: '99999999-9999-9999-9999-999999999999'}, flags: {}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
`=== 99999999-9999-9999-9999-999999999999
Include:    foo,bar
Level:      notify
URL:        http://foobar.com
Webhook ID: 99999999-9999-9999-9999-999999999999
`)
    })
  })

  it('# shows a webhook', function () {
    let mock = nock('https://api.heroku.com')
      .get('/pipelines/example/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        include: ['foo', 'bar'],
        level: 'notify',
        url: 'http://foobar.com'
      })

    return info.run({args: {id: '99999999-9999-9999-9999-999999999999'}, flags: {pipeline: 'example'}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
`=== 99999999-9999-9999-9999-999999999999
Include:    foo,bar
Level:      notify
URL:        http://foobar.com
Webhook ID: 99999999-9999-9999-9999-999999999999
`)
    })
  })
})
