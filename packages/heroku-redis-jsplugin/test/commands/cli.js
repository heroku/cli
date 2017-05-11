'use strict'
/* globals describe it beforeEach cli */

let nock = require('nock')
let sinon = require('sinon')
let proxyquire = require('proxyquire').noCallThru()
let expect = require('chai').expect
let Duplex = require('stream').Duplex
let EventEmitter = require('events').EventEmitter

let command, net, tls

describe('heroku redis:cli', function () {
  let command = proxyquire('../../commands/cli.js', {net: {}, tls: {}, ssh2: {}})
  require('../lib/shared').shouldHandleArgs(command)
})

describe('heroku redis:cli', function () {
  beforeEach(function () {
    cli.mockConsole()

    class Client extends Duplex {
      _write (chunk, encoding, callback) { }
      _read (size) { this.emit('end') }
    }

    net = {
      connect: sinon.stub().returns(new Client())
    }

    tls = {
      connect: sinon.stub().returns(new Client())
    }

    class Tunnel extends EventEmitter {
      connect () {
        this.emit('ready')
      }

      forwardOut (localHost, localPort, hostname, port, cb) {
        cb(null, new Client())
      }
    }

    let ssh2 = {Client: Tunnel}

    command = proxyquire('../../commands/cli.js', {net, tls, ssh2})
  })

  it('# for hobby it uses net.connect', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars').reply(200, {'FOO': 'BAR'})

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku').reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649',
        plan: 'hobby'
      })
    return command.run({app: 'example', flags: {confirm: 'example'}, args: {}, auth: {username: 'foobar', password: 'password'}})
    .then(() => app.done())
    .then(() => configVars.done())
    .then(() => redis.done())
    .then(() => expect(cli.stdout).to.equal('Connecting to redis-haiku (REDIS_FOO, REDIS_BAR):\n'))
    .then(() => expect(cli.stderr).to.equal(''))
    .then(() => expect(net.connect.called).to.equal(true))
  })

  it('# for premium it uses tls.connect', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars').reply(200, {'FOO': 'BAR'})

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku').reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649',
        plan: 'premium-0'
      })

    return command.run({app: 'example', flags: {confirm: 'example'}, args: {}, auth: {username: 'foobar', password: 'password'}})
    .then(() => app.done())
    .then(() => configVars.done())
    .then(() => redis.done())
    .then(() => expect(cli.stdout).to.equal('Connecting to redis-haiku (REDIS_FOO, REDIS_BAR):\n'))
    .then(() => expect(cli.stderr).to.equal(''))
    .then(() => expect(tls.connect.called).to.equal(true))
  })

  it('# for bastion it uses tunnel.connect', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        { name: 'redis-haiku',
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_URL', 'REDIS_BASTIONS', 'REDIS_BASTION_KEY', 'REDIS_BASTION_REKEYS_AFTER'] }
      ])

    let configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars').reply(200, {'REDIS_BASTIONS': 'example.com'})

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku').reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649',
        plan: 'premium-0'
      })

    return command.run({app: 'example', flags: {confirm: 'example'}, args: {}, auth: {username: 'foobar', password: 'password'}})
    .then(() => app.done())
    .then(() => configVars.done())
    .then(() => redis.done())
    .then(() => expect(cli.stdout).to.equal('Connecting to redis-haiku (REDIS_URL):\n'))
    .then(() => expect(cli.stderr).to.equal(''))
  })
})
