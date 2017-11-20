'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../commands/webhooks/index')

describe('heroku webhooks:add', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('# lists webhooks', function () {
    let mock = nock('https://api.heroku.com')
      .get('/apps/example/webhooks')
      .reply(200, [{
        id: '99999999-9999-9999-9999-999999999999',
        include: ['foo', 'bar'],
        level: 'notify',
        url: 'http://foobar.com'
      }])

    return certs.run({app: 'example', args: {}, flags: {}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
`Webhook ID                            URL                Include  Level
────────────────────────────────────  ─────────────────  ───────  ──────
99999999-9999-9999-9999-999999999999  http://foobar.com  foo,bar  notify
`)
    })
  })

  it('# lists empty webhooks', function () {
    let mock = nock('https://api.heroku.com')
      .get('/apps/example/webhooks')
      .reply(200, [])

    return certs.run({app: 'example', args: {}, flags: {}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal('example has no webhooks\nUse heroku webhooks:add to add one.\n')
    })
  })

  it('# lists pipeline webhooks', function () {
    let mock = nock('https://api.heroku.com')
      .get('/pipelines/example/webhooks')
      .reply(200, [{
        id: '99999999-9999-9999-9999-999999999999',
        include: ['foo', 'bar'],
        level: 'notify',
        url: 'http://foobar.com'
      }])

    return certs.run({args: {}, flags: {pipeline: 'example'}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
`Webhook ID                            URL                Include  Level
────────────────────────────────────  ─────────────────  ───────  ──────
99999999-9999-9999-9999-999999999999  http://foobar.com  foo,bar  notify
`)
    })
  })

  it('# lists empty pipeline webhooks', function () {
    let mock = nock('https://api.heroku.com')
      .get('/pipelines/example/webhooks')
      .reply(200, [])

    return certs.run({args: {}, flags: {pipeline: 'example'}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal('example has no webhooks\nUse heroku webhooks:add to add one.\n')
    })
  })
})
