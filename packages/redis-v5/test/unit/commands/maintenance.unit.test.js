'use strict'
/* globals beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let exit = require('heroku-cli-util').exit

let command = require('../../../commands/maintenance')
const unwrap = require('../../unwrap')

describe('heroku redis:maintenance', function () {
  require('../lib/shared.unit.test').shouldHandleArgs(command)
})

describe('heroku redis:maintenance', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
    exit.mock()
  })

  it('# shows the maintenance message', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, plan: {name: 'premium-0'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    let redis = nock('https://api.data.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku/maintenance').reply(200, {message: 'Message'})

    return command.run({app: 'example', args: {}, flags: {}, auth: {username: 'foobar', password: 'password'}})
      .then(() => app.done())
      .then(() => redis.done())
      .then(() => expect(cli.stdout).to.equal('Message\n'))
      .then(() => expect(cli.stderr).to.equal(''))
  })

  it('# sets the maintenance window', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, plan: {name: 'premium-0'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    let redis = nock('https://api.data.heroku.com:443')
      .put('/redis/v0/databases/redis-haiku/maintenance_window', {
        description: 'Mon 10:00',
      }).reply(200, {window: 'Mon 10:00'})

    return expect(command.run({app: 'example', args: {}, flags: {window: 'Mon 10:00'}, auth: {username: 'foobar', password: 'password'}})).to.be.rejectedWith(exit.ErrorExit)
      .then(() => app.done())
      .then(() => redis.done)
      .then(() => expect(cli.stdout).to.equal('Maintenance window for redis-haiku (REDIS_FOO, REDIS_BAR) set to Mon 10:00.\n'))
      .then(() => expect(cli.stderr).to.equal(''))
  })

  it('# runs the maintenance', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, plan: {name: 'premium-0'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    let appInfo = nock('https://api.heroku.com:443')
      .get('/apps/example').reply(200, {maintenance: true})

    let redis = nock('https://api.data.heroku.com:443')
      .post('/redis/v0/databases/redis-haiku/maintenance').reply(200, {message: 'Message'})

    return expect(command.run({app: 'example', args: {}, flags: {run: true}, auth: {username: 'foobar', password: 'password'}})).to.be.rejectedWith(exit.ErrorExit)
      .then(() => app.done())
      .then(() => appInfo.done())
      .then(() => redis.done())
      .then(() => expect(cli.stdout).to.equal('Message\n'))
      .then(() => expect(cli.stderr).to.equal(''))
  })

  it('# run errors out when not in maintenance', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, plan: {name: 'premium-0'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    let appInfo = nock('https://api.heroku.com:443')
      .get('/apps/example').reply(200, {maintenance: false})

    return expect(command.run({app: 'example', args: {}, flags: {run: true}, auth: {username: 'foobar', password: 'password'}})).to.be.rejectedWith(exit.ErrorExit)
      .then(() => app.done())
      .then(() => appInfo.done())
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(unwrap(cli.stderr)).to.equal('Application must be in maintenance mode or --force flag must be used\n'))
  })

  it('# errors out on hobby dynos', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, plan: {name: 'hobby'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    return expect(command.run({app: 'example', args: {}, auth: {username: 'foobar', password: 'password'}})).to.be.rejected
      .then(() => expect(unwrap(cli.stderr)).to.equal('redis:maintenance is not available for hobby-dev instances\n'))
      .then(() => app.done())
  })

  it('# errors out on bad maintenance window', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, plan: {name: 'premium-0'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    return expect(command.run({app: 'example', args: {}, flags: {window: 'Mon 10:45'}, auth: {username: 'foobar', password: 'password'}})).to.be.rejected
      .then(() => app.done())
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(unwrap(cli.stderr)).to.equal('Maintenance windows must be "Day HH:MM", where MM is 00 or 30.\n'))
  })
})
