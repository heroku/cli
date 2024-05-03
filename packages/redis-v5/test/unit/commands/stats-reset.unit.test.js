'use strict'
/* globals beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let exit = require('@heroku/heroku-cli-util').exit

let command = require('../../../commands/stats-reset')

describe('heroku redis:stats-reset', () => {
  beforeEach(() => {
    cli.mockConsole()
    nock.cleanAll()
    exit.mock()
  })

  it('# resets the stats of the addon', () => {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_URL']},
      ])

    let redis = nock('https://api.data.heroku.com:443')
      .post('/redis/v0/databases/redis-haiku/stats/reset').reply(200, {
        message: 'Stats reset successful.',
      })

    return command.run({app: 'example', flags: {confirm: 'example'}, args: {}, auth: {username: 'foobar', password: 'password'}})
      .then(() => app.done())
      .then(() => redis.done())
      .then(() => expect(cli.stdout).to.equal('Stats reset successful.\n'))
      .then(() => expect(cli.stderr).to.equal(''))
  })
})
