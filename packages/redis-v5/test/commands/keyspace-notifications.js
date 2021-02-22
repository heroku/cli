'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let exit = require('heroku-cli-util').exit

let command = require('../../commands/keyspace-notifications')
const unwrap = require('../unwrap')

describe('heroku redis:keyspace-notifications', function () {
  require('../lib/shared').shouldHandleArgs(command, { config: 'AKE' })
})

describe('heroku redis:keyspace-notifications', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
    exit.mock()
  })

  it('# sets the keyspace notify events', async function() {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        { name: 'redis-haiku', addon_service: { name: 'heroku-redis' }, config_vars: ['REDIS_FOO', 'REDIS_BAR'] }
      ])

    let redis = nock('https://redis-api.heroku.com:443')
      .patch('/redis/v0/databases/redis-haiku/config', { notify_keyspace_events: 'AKE' }).reply(200, {
        notify_keyspace_events: { value: 'AKE', values: { 'AKE': '' } }
      })

    await command.run({ app: 'example', flags: { config: 'AKE' }, args: {}, auth: { username: 'foobar', password: 'password' } })

    app.done();
    redis.done();

    expect(cli.stdout).to.equal(
        `Keyspace notifications for redis-haiku (REDIS_FOO, REDIS_BAR) set to 'AKE'.\n`
      );

    return expect(cli.stderr).to.equal('')
  })

  it('# errors on missing eviction policy', async function() {
    await expect(command.run({ app: 'example', flags: {}, args: {} })).to.be.rejectedWith(exit.ErrorExit)

    expect(cli.stdout).to.equal('');

    return expect(unwrap(cli.stderr)).to.equal('Please specify a valid keyspace notification configuration.\n')
  })
})
