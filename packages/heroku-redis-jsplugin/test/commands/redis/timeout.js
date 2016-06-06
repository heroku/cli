'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let exit = require('heroku-cli-util').exit

let command = require('../../../lib/commands/redis/timeout.js')

describe('heroku redis:timeout', function () {
  require('./shared.js').shouldHandleArgs(command, {seconds: '5'})
})

describe('heroku redis:timeout', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
    exit.mock()
  })

  it('# sets the timout', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let redis = nock('https://redis-api.heroku.com:443')
      .patch('/redis/v0/databases/redis-haiku/config', {timeout: 5}).reply(200, {
        timeout: {value: 5}
      })

    return command.run({app: 'example', flags: {seconds: '5'}, args: {}, auth: {username: 'foobar', password: 'password'}})
    .then(() => app.done())
    .then(() => redis.done())
    .then(() => expect(cli.stdout).to.equal(
 `Timeout for redis-haiku (REDIS_FOO, REDIS_BAR) set to 5 seconds.
Connections to the Redis instance will be stopped after idling for 5 seconds.
`))
    .then(() => expect(cli.stderr).to.equal(''))
  })

  it('# sets the timout to zero', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let redis = nock('https://redis-api.heroku.com:443')
      .patch('/redis/v0/databases/redis-haiku/config', {timeout: 0}).reply(200, {
        timeout: {value: 0}
      })

    return command.run({app: 'example', flags: {seconds: '0'}, args: {}, auth: {username: 'foobar', password: 'password'}})
    .then(() => app.done())
    .then(() => redis.done())
    .then(() => expect(cli.stdout).to.equal(
 `Timeout for redis-haiku (REDIS_FOO, REDIS_BAR) set to 0 seconds.
Connections to the Redis instance can idle indefinitely.
`))
    .then(() => expect(cli.stderr).to.equal(''))
  })

  it('# errors on missing timeout', function () {
    return expect(command.run({app: 'example', flags: {}, args: {}})).to.be.rejectedWith(exit.ErrorExit)
    .then(() => expect(cli.stdout).to.equal(''))
    .then(() => expect(cli.stderr).to.equal(' ▸    Please specify a valid timeout value.\n'))
  })
})
