'use strict'
/* globals beforeEach */

const cli = require('heroku-cli-util')
let nock = require('nock')
let expect = require('chai').expect
const unwrap = require('../../unwrap')
let cmd = require('../../../commands/wait')

describe('heroku redis:wait ', () => {
  beforeEach(() => {
    cli.mockConsole()
    nock.cleanAll()
    cli.exit.mock()
  })

  it('# returns when waiting? is false', () => {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_URL']},
      ])

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku/wait').reply(200, {'waiting?': false})

    return cmd.run({app: 'example', flags: {}, args: {}})
      .then(() => app.done())
      .then(() => redis.done())
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal(''))
  })

  it('# waits for version upgrade', () => {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_URL']},
      ])

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku/wait').reply(200, {'waiting?': true, message: 'upgrading version'})
      .get('/redis/v0/databases/redis-haiku/wait').reply(200, {'waiting?': false, message: 'available'})

    return cmd.run({app: 'example', flags: {}, args: {}})
      .then(() => app.done())
      .then(() => redis.done())
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal(`Waiting for database redis-haiku... upgrading version
Waiting for database redis-haiku... available
`))
  })
})
