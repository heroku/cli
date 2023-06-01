'use strict'
/* globals beforeEach cli */

let nock = require('nock')
let expect = require('chai').expect

let command = require('../../../commands/credentials')

describe('heroku redis:credentials', function () {
  require('../lib/shared.unit.test').shouldHandleArgs(command)
})

describe('heroku redis:credentials', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('# displays the redis credentials', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku').reply(200, {
        info: [{name: 'Foo', values: ['Bar', 'Biz']}],
        resource_url: 'redis://foobar:password@hostname:8649',
      })

    return command.run({app: 'example', flags: {}, args: {}, auth: {username: 'foobar', password: 'password'}})
      .then(() => app.done())
      .then(() => redis.done())
      .then(() => expect(cli.stdout).to.equal('redis://foobar:password@hostname:8649\n'))
      .then(() => expect(cli.stderr).to.equal(''))
  })

  it('# resets the redis credentials', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    let redis = nock('https://redis-api.heroku.com:443')
      .post('/redis/v0/databases/redis-haiku/credentials_rotation').reply(200, {})

    return command.run({app: 'example', flags: {reset: true}, args: {}, auth: {username: 'foobar', password: 'password'}})
      .then(() => app.done())
      .then(() => redis.done())
      .then(() => expect(cli.stdout).to.equal('Resetting credentials for redis-haiku\n'))
      .then(() => expect(cli.stderr).to.equal(''))
  })
})
