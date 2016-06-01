'use strict'
/* globals describe afterEach beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/domains/wait')
const expect = require('chai').expect
const lolex = require('lolex')

let clock

describe('domains:wait', function () {
  beforeEach(function () {
    cli.mockConsole()
    clock = lolex.install()
    clock.setTimeout = function (fn, timeout) { fn() }
  })

  afterEach(function () {
    clock.uninstall()
  })

  it('waits for a domain', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/foo.com')
      .reply(200, {status: 'none', hostname: 'foo.com'})
    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}})
      .then(() => api.done())
      .then(() => expect(cli.stderr).to.equal('Waiting for foo.com... done\n'))
  })

  it('adds a domain with the wait message succeeded', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/foo.com')
      .reply(200, {status: 'pending', id: '1234', hostname: 'foo.com'})

    let status1 = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/1234')
      .reply(200, {status: 'pending', id: '1234', hostname: 'foo.com'})

    let status2 = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/1234')
      .reply(200, {status: 'succeeded', id: '1234', hostname: 'foo.com'})

    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}})
      .then(() => api.done())
      .then(() => status1.done())
      .then(() => status2.done())
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('Waiting for foo.com... done\n'))
  })

  it('adds a domain with the wait message failed', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/foo.com')
      .reply(200, {status: 'pending', id: '1234', hostname: 'foo.com'})

    let status1 = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/1234')
      .reply(200, {status: 'pending', id: '1234', hostname: 'foo.com'})

    let status2 = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/1234')
      .reply(200, {status: 'failed', id: '1234', hostname: 'foo.com'})

    let thrown = false
    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}})
      .catch(function (err) {
        expect(err).to.be.an.instanceof(Error)
        expect(err.message).to.equal('The domain creation finished with status failed')
        thrown = true
      })
      .then(() => expect(thrown).to.equal(true))
      .then(() => api.done())
      .then(() => status1.done())
      .then(() => status2.done())
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('Waiting for foo.com... !\n'))
  })

  it('adds a domain with the wait message failed immediately', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/foo.com')
      .reply(200, {status: 'failed', id: '1234', hostname: 'foo.com'})

    let thrown = false
    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}})
      .catch(function (err) {
        expect(err).to.be.an.instanceof(Error)
        expect(err.message).to.equal('The domain creation finished with status failed')
        thrown = true
      })
      .then(() => expect(thrown).to.equal(true))
      .then(() => api.done())
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('Waiting for foo.com... !\n'))
  })
})
