'use strict'
/* globals describe afterEach beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/domains/add')
const expect = require('chai').expect
const lolex = require('lolex')

let clock

describe('domains:add', function () {
  beforeEach(function () {
    cli.mockConsole()
    clock = lolex.install()
    clock.setTimeout = function (fn, timeout) { fn() }
    nock.cleanAll()
  })

  afterEach(function () {
    clock.uninstall()
  })

  it('adds a domain', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/domains', {hostname: 'foo.com'})
      .reply(200, {status: 'none'})
    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}, flags: {}})
      .then(() => api.done())
      .then(() => expect(cli.stderr).to.equal(
`Adding foo.com to myapp... done
 ▸    Configure your app's DNS provider to point to the DNS Target undefined.
 ▸    For help, see https://devcenter.heroku.com/articles/custom-domains
`))
  })

  it('adds a domain with status pending and wait false', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/domains', {hostname: 'foo.com'})
      .reply(200, {status: 'pending'})
    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}, flags: {}})
      .then(() => api.done())
      .then(() => expect(cli.stderr).to.equal(
`Adding foo.com to myapp... done
 ▸    Configure your app's DNS provider to point to the DNS Target undefined.
 ▸    For help, see https://devcenter.heroku.com/articles/custom-domains

The domain foo.com has been enqueued for addition
 ▸    Run heroku domains:wait 'foo.com' to wait for completion
`))
  })

  it('adds a wildcard domain with status pending and wait false', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/domains', {hostname: '*.foo.com'})
      .reply(200, {status: 'pending'})
    return cmd.run({app: 'myapp', args: {hostname: '*.foo.com'}, flags: {}})
      .then(() => api.done())
      .then(() => expect(cli.stderr).to.equal(
`Adding *.foo.com to myapp... done
 ▸    Configure your app's DNS provider to point to the DNS Target undefined.
 ▸    For help, see https://devcenter.heroku.com/articles/custom-domains

The domain *.foo.com has been enqueued for addition
 ▸    Run heroku domains:wait '*.foo.com' to wait for completion
`))
  })

  it('adds a domain with the wait message succeeded', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/domains', {hostname: 'foo.com'})
      .reply(200, {status: 'pending', id: '1234', hostname: 'foo.com'})

    let status1 = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/1234')
      .reply(200, {status: 'pending', id: '1234', hostname: 'foo.com'})

    let status2 = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/1234')
      .reply(200, {status: 'succeeded', id: '1234', hostname: 'foo.com'})

    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}, flags: {wait: true}})
      .then(() => api.done())
      .then(() => status1.done())
      .then(() => status2.done())
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal(
`Adding foo.com to myapp... done
 ▸    Configure your app's DNS provider to point to the DNS Target undefined.
 ▸    For help, see https://devcenter.heroku.com/articles/custom-domains

Waiting for foo.com... done
`))
  })

  it('adds a domain with the wait message failed', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/domains', {hostname: 'foo.com'})
      .reply(200, {status: 'pending', id: '1234', hostname: 'foo.com'})

    let status1 = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/1234')
      .reply(200, {status: 'pending', id: '1234', hostname: 'foo.com'})

    let status2 = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains/1234')
      .reply(200, {status: 'failed', id: '1234', hostname: 'foo.com'})

    let thrown = false
    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}, flags: {wait: true}})
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
      .then(() => expect(cli.stderr).to.equal(
`Adding foo.com to myapp... done
 ▸    Configure your app's DNS provider to point to the DNS Target undefined.
 ▸    For help, see https://devcenter.heroku.com/articles/custom-domains

Waiting for foo.com... !
`))
  })

  it('adds a domain with the wait message failed immediately', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/domains', {hostname: 'foo.com'})
      .reply(200, {status: 'failed', id: '1234', hostname: 'foo.com'})

    let thrown = false
    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}, flags: {wait: true}})
      .catch(function (err) {
        expect(err).to.be.an.instanceof(Error)
        expect(err.message).to.equal('The domain creation finished with status failed')
        thrown = true
      })
      .then(() => expect(thrown).to.equal(true))
      .then(() => api.done())
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal(
`Adding foo.com to myapp... done
 ▸    Configure your app's DNS provider to point to the DNS Target undefined.
 ▸    For help, see https://devcenter.heroku.com/articles/custom-domains

Waiting for foo.com... !
`))
  })
})
