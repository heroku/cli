'use strict'
/* globals describe it before after cli */

let nock = require('nock')
let lolex = require('lolex')
let expect = require('chai').expect

let command = require('../../commands/wait')

let clock

/*
 * Due to weird interactions between async and promises
 * and q promises and mocha, I had to put the tests in
 * after rather an an afterEach or the test itself
 */
describe('heroku redis:wait ', function () {
  require('../lib/shared').shouldHandleArgs(command)
})

describe('heroku redis:wait waiting? false', function () {
  before(function () {
    cli.mockConsole()
    nock.cleanAll()
    clock = lolex.install()
  })

  after(function () {
    clock.uninstall()
    expect(Object.keys(clock.timers).length).to.equal(0)
    expect(cli.stdout).to.equal('')
    expect(cli.stderr).to.equal('')
  })

  it('# waits until waiting? false', function (done) {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let redis_waiting = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku/wait').reply(200, {'waiting?': false})

    command.run({app: 'example', flags: {}, args: {}, auth: {username: 'foobar', password: 'password'}})
    .then(() => app.done())
    .then(() => clock.next())
    .then(() => redis_waiting.done())
    .then(() => done())
  })
})

describe('heroku redis:wait waiting? true', function () {
  before(function () {
    cli.mockConsole()
    nock.cleanAll()
    clock = lolex.install()
  })

  after(function () {
    clock.uninstall()
    expect(Object.keys(clock.timers).length).to.equal(1)
    expect(cli.stdout).to.equal('')
    expect(cli.stderr).to.equal('')
  })

  it('# waits', function (done) {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let redis_waiting = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku/wait').reply(200, {'waiting?': true})

    command.run({app: 'example', flags: {}, args: {}, auth: {username: 'foobar', password: 'password'}})
    .then(() => app.done())
    .then(() => clock.next())
    .then(() => redis_waiting.done())
    .then(() => done())
  })
})

describe('heroku redis:timeout waiting? error', function () {
  before(function () {
    cli.mockConsole()
    nock.cleanAll()
    clock = lolex.install()
  })

  after(function () {
    clock.uninstall()
    expect(Object.keys(clock.timers).length).to.equal(0)
    expect(cli.stdout).to.equal('')
    expect(cli.stderr).to.equal(' ▸    Error\n')
  })

  it('# waits until error', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let redis_waiting = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku/wait').reply(503, {'error': 'Error'})

    return command.run({app: 'example', flags: {}, args: {}, auth: {username: 'foobar', password: 'password'}})
    .then(() => app.done())
    .then(() => clock.next())
    .then(() => redis_waiting.done())
  })
})
