'use strict'
/* globals beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let exit = require('heroku-cli-util').exit

let command = require('../../../commands/maxmemory')
const unwrap = require('../../unwrap')

describe('heroku redis:maxmemory', function () {
  require('../lib/shared.unit.test').shouldHandleArgs(command, {policy: 'noeviction'})
})

describe('heroku redis:maxmemory', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
    exit.mock()
  })

  it('# sets the key eviction policy', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    let redis = nock('https://api.data.heroku.com:443')
      .patch('/redis/v0/databases/redis-haiku/config', {maxmemory_policy: 'noeviction'}).reply(200, {
        maxmemory_policy: {value: 'noeviction', values: {noeviction: 'return errors when memory limit is reached'}},
      })

    return command.run({app: 'example', flags: {policy: 'noeviction'}, args: {}, auth: {username: 'foobar', password: 'password'}})
      .then(() => app.done())
      .then(() => redis.done())
      .then(() => expect(cli.stdout).to.equal(
        `Maxmemory policy for redis-haiku (REDIS_FOO, REDIS_BAR) set to noeviction.
noeviction return errors when memory limit is reached.
`,
      ))
      .then(() => expect(cli.stderr).to.equal(''))
  })

  it('# errors on missing eviction policy', function () {
    return expect(command.run({app: 'example', flags: {}, args: {}})).to.be.rejectedWith(exit.ErrorExit)
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(unwrap(cli.stderr)).to.equal('Please specify a valid maxmemory eviction policy.\n'))
  })
})
