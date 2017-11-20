'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../commands/webhooks/add')

describe('heroku webhooks:add', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('# adds an webhook', function () {
    let mock = nock('https://api.heroku.com')
      .post('/apps/example/webhooks', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com'
      })
      .reply(200, {})

    return certs.run({app: 'example', args: {}, flags: {
      include: ' foo , bar ',
      level: 'notify',
      secret: '1234',
      url: 'http://foobar.com'
    }}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Adding webhook to example... done\n')
      expect(cli.stdout).to.equal('')
    })
  })

  it('# adds an webhook with secret', function () {
    let mock = nock('https://api.heroku.com')
      .post('/apps/example/webhooks', {
        include: ['foo', 'bar'],
        level: 'notify',
        url: 'http://foobar.com'
      })
      .reply(200, {}, {'Heroku-Webhook-Secret': '1234'})

    return certs.run({app: 'example', args: {}, flags: {
      include: ' foo , bar ',
      level: 'notify',
      url: 'http://foobar.com'
    }}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Adding webhook to example... done\n')
      expect(cli.stdout).to.equal('=== Webhooks Signing Secret\n1234\n')
    })
  })

  it('# adds a pipeline webhook', function () {
    let mock = nock('https://api.heroku.com')
      .post('/pipelines/example/webhooks', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com'
      })
      .reply(200, {})

    return certs.run({args: {}, flags: {
      include: ' foo , bar ',
      level: 'notify',
      secret: '1234',
      url: 'http://foobar.com',
      pipeline: 'example'
    }}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Adding webhook to example... done\n')
      expect(cli.stdout).to.equal('')
    })
  })
})
