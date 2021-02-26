'use strict'
/* globals describe it beforeEach cli */

let nock = require('nock')
let expect = require('chai').expect

let command = require('../../commands/promote')

describe('heroku redis:promote', function () {
  require('../lib/shared').shouldHandleArgs(command)
})

describe('heroku redis:promote', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('# promotes', async function() {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        { name: 'redis-silver-haiku', addon_service: { name: 'heroku-redis' }, config_vars: ['REDIS_URL', 'HEROKU_REDIS_SILVER_URL'] },
        { name: 'redis-gold-haiku', addon_service: { name: 'heroku-redis' }, config_vars: ['HEROKU_REDIS_GOLD_URL'] }
      ])

    let attach = nock('https://api.heroku.com:443')
      .post('/addon-attachments', {
        'app': { 'name': 'example' },
        'addon': { 'name': 'redis-gold-haiku' },
        'confirm': 'example',
        'name': 'REDIS'
      }).reply(200, {})

    await command.run({ app: 'example', flags: {}, args: { database: 'redis-gold-haiku' }, auth: { username: 'foobar', password: 'password' } })

    app.done();
    attach.done();
    expect(cli.stdout).to.equal('Promoting redis-gold-haiku to REDIS_URL on example\n');

    return expect(cli.stderr).to.equal('')
  })

  it('# promotes and replaces attachment of existing REDIS_URL if necessary', async function() {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {
          name: 'redis-silver-haiku',
          addon_service: { name: 'heroku-redis' },
          config_vars: [
            'REDIS_URL',
            'REDIS_BASTIONS',
            'REDIS_BASTION_KEY',
            'REDIS_BASTION_REKEYS_AFTER'
          ]
        },
        { name: 'redis-gold-haiku', addon_service: { name: 'heroku-redis' }, config_vars: ['HEROKU_REDIS_GOLD_URL'] }
      ])

    let attachRedisUrl = nock('https://api.heroku.com:443')
      .post('/addon-attachments', {
        'app': { 'name': 'example' },
        'addon': { 'name': 'redis-silver-haiku' },
        'confirm': 'example'
      }).reply(200, {})

    let attach = nock('https://api.heroku.com:443')
      .post('/addon-attachments', {
        'app': { 'name': 'example' },
        'addon': { 'name': 'redis-gold-haiku' },
        'confirm': 'example',
        'name': 'REDIS'
      }).reply(200, {})

    await command.run({ app: 'example', flags: {}, args: { database: 'redis-gold-haiku' }, auth: { username: 'foobar', password: 'password' } })

    app.done();
    attachRedisUrl.done();
    attach.done();
    expect(cli.stdout).to.equal('Promoting redis-gold-haiku to REDIS_URL on example\n');

    return expect(cli.stderr).to.equal('')
  })
})
