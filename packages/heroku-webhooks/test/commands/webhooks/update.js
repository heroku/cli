'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../commands/webhooks/update')

describe('heroku webhooks:update', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('# updates a webhook', function () {
    let mock = nock('https://api.heroku.com')
      .patch('/apps/example/webhooks/99999999-9999-9999-9999-999999999999', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com'
      })
      .reply(200, {})

    return certs.run({app: 'example', args: {
      id: '99999999-9999-9999-9999-999999999999'
    }, flags: {
      include: ' foo , bar ',
      level: 'notify',
      secret: '1234',
      url: 'http://foobar.com'
    }}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Updating webhook 99999999-9999-9999-9999-999999999999 for example... done\n')
      expect(cli.stdout).to.equal('')
    })
  })

  it('# updates a webhook', function () {
    let mock = nock('https://api.heroku.com')
      .patch('/pipelines/example/webhooks/99999999-9999-9999-9999-999999999999', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com'
      })
      .reply(200, {})

    return certs.run({args: {
      id: '99999999-9999-9999-9999-999999999999'
    }, flags: {
      include: ' foo , bar ',
      level: 'notify',
      secret: '1234',
      url: 'http://foobar.com',
      pipeline: 'example'
    }}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Updating webhook 99999999-9999-9999-9999-999999999999 for example... done\n')
      expect(cli.stdout).to.equal('')
    })
  })
})
