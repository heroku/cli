'use strict'
/* globals beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let exit = require('@heroku/heroku-cli-util').exit

let command = require('../../../commands/upgrade')
const unwrap = require('../../unwrap')

describe('heroku redis:upgrade', () => {
  beforeEach(() => {
    cli.mockConsole()
    nock.cleanAll()
    exit.mock()
  })

  it('# upgrades the redis version', () => {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_URL']},
      ])

    let redis = nock('https://api.data.heroku.com:443')
      .post('/redis/v0/databases/redis-haiku/upgrade', {version: '6.2'}).reply(200, {
        message: 'Upgrading version now!',
      })

    return command.run({app: 'example', flags: {confirm: 'example', version: '6.2'}, args: {}, auth: {username: 'foobar', password: 'password'}})
      .then(() => app.done())
      .then(() => redis.done())
      .then(() => expect(cli.stderr).to.equal('Requesting upgrade of redis-haiku to 6.2... Upgrading version now!\n'))
  })

  it('# errors on missing version', function () {
    return expect(command.run({app: 'example', flags: {}, args: {}})).to.be.rejectedWith(exit.ErrorExit)
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(unwrap(cli.stderr)).to.equal('Please specify a valid version.\n'))
  })
})
