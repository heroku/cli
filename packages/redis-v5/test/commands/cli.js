'use strict'
/* globals describe it beforeEach cli */

let nock = require('nock')
let sinon = require('sinon')
let proxyquire = require('proxyquire').noCallThru()
let expect = require('chai').expect
let Duplex = require('stream').Duplex
let EventEmitter = require('events').EventEmitter

let command, net, tls, tunnel

describe('heroku redis:cli', function () {
  let command = proxyquire('../../commands/cli.js', { net: {}, tls: {}, ssh2: {} })
  require('../lib/shared').shouldHandleArgs(command)
})

describe('heroku redis:cli', function () {
  const addonId = '1dcb269b-8be5-4132-8aeb-e3f3c7364958'
  const appId = '7b0ae612-8775-4502-a5b5-2b45a4d18b2d'

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
      constructor () {
        super()
        tunnel = this
        this.forwardOut = sinon.stub().yields(null, new Client())
        this.connect = sinon.stub().callsFake(() => {
          this.emit('ready')
        })
      }
    }

    let ssh2 = { Client: Tunnel }

    command = proxyquire('../../commands/cli.js', { net, tls, ssh2 })
  })

  it('# for hobby it uses net.connect', async function() {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: { name: 'heroku-redis' },
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          billing_entity: {
            id: appId,
            name: 'example'
          }
        }
      ])

    let configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars').reply(200, { 'FOO': 'BAR' })

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku').reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649',
        plan: 'hobby'
      })

    await command.run({ app: 'example', flags: { confirm: 'example' }, args: {}, auth: { username: 'foobar', password: 'password' } })

    app.done();
    configVars.done();
    redis.done();
    expect(cli.stdout).to.equal('Connecting to redis-haiku (REDIS_FOO, REDIS_BAR):\n');
    expect(cli.stderr).to.equal('');

    return expect(net.connect.called).to.equal(true)
  })

  it('# for hobby it uses TLS if prefer_native_tls', async function() {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: { name: 'heroku-redis' },
          config_vars: ['REDIS_FOO', 'REDIS_BAR', 'REDIS_TLS_URL'],
          billing_entity: {
            id: appId,
            name: 'example'
          }
        }
      ])

    let configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars').reply(200, { 'REDIS_TLS_URL': 'rediss://foobar:password@example.com:8649' })

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku').reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649',
        plan: 'hobby',
        prefer_native_tls: true
      })

    await command.run({ app: 'example', flags: { confirm: 'example' }, args: {}, auth: { username: 'foobar', password: 'password' } })

    app.done();
    configVars.done();
    redis.done();
    expect(cli.stdout).to.equal('Connecting to redis-haiku (REDIS_FOO, REDIS_BAR, REDIS_TLS_URL):\n');
    expect(cli.stderr).to.equal('');

    return expect(tls.connect.called).to.equal(true)
  })

  it('# for premium it uses tls.connect', async function() {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: { name: 'heroku-redis' },
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          billing_entity: {
            id: appId,
            name: 'example'
          }
        }
      ])

    let configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars').reply(200, { 'FOO': 'BAR' })

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku').reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649',
        plan: 'premium-0'
      })

    await command.run({ app: 'example', flags: { confirm: 'example' }, args: {}, auth: { username: 'foobar', password: 'password' } })

    app.done();
    configVars.done();
    redis.done();
    expect(cli.stdout).to.equal('Connecting to redis-haiku (REDIS_FOO, REDIS_BAR):\n');
    expect(cli.stderr).to.equal('');

    return expect(tls.connect.called).to.equal(true)
  })

  it('# for bastion it uses tunnel.connect', async function() {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: { name: 'heroku-redis' },
          config_vars: ['REDIS_URL', 'REDIS_BASTIONS', 'REDIS_BASTION_KEY', 'REDIS_BASTION_REKEYS_AFTER'],
          billing_entity: {
            id: appId,
            name: 'example'
          }
        }
      ])

    let configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars').reply(200, { 'REDIS_BASTIONS': 'example.com' })

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku').reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649',
        plan: 'premium-0'
      })

    await command.run({ app: 'example', flags: { confirm: 'example' }, args: {}, auth: { username: 'foobar', password: 'password' } })

    app.done();
    configVars.done();
    redis.done();
    expect(cli.stdout).to.equal('Connecting to redis-haiku (REDIS_URL):\n');

    return expect(cli.stderr).to.equal('')
  })

  it('# for private spaces bastion with prefer_native_tls, it uses tls.connect', async function() {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        { id: addonId,
          name: 'redis-haiku',
          addon_service: { name: 'heroku-redis' },
          config_vars: ['REDIS_URL', 'REDIS_BASTIONS', 'REDIS_BASTION_KEY', 'REDIS_BASTION_REKEYS_AFTER'],
          billing_entity: {
            id: appId,
            name: 'example'
          }
        }
      ])

    let configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars').reply(200, { 'REDIS_BASTIONS': 'example.com' })

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku').reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649',
        plan: 'private-7',
        prefer_native_tls: true
      })

    await command.run({ app: 'example', flags: { confirm: 'example' }, args: {}, auth: { username: 'foobar', password: 'password' } })

    app.done();
    configVars.done();
    redis.done();
    expect(cli.stdout).to.equal('Connecting to redis-haiku (REDIS_URL):\n');
    expect(cli.stderr).to.equal('');

    return expect(tls.connect.called).to.equal(true)
  })

  it('# selects correct connection information when multiple redises are present across multiple apps', async () => {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: { name: 'heroku-redis' },
          config_vars: ['REDIS_URL', 'REDIS_BASTIONS', 'REDIS_BASTION_KEY', 'REDIS_BASTION_REKEYS_AFTER'],
          billing_entity: {
            id: appId,
            name: 'example'
          }
        },
        {
          id: 'heroku-redis-addon-id-2',
          name: 'redis-sonnet',
          addon_service: { name: 'heroku-redis' },
          config_vars: ['REDIS_6_URL', 'REDIS_6_BASTIONS', 'REDIS_6_BASTION_KEY', 'REDIS_6_BASTION_REKEYS_AFTER'],
          billing_entity: {
            id: 'app-2-id',
            name: 'example-app-2'
          }
        }
      ])

    let configVars = nock('https://api.heroku.com:443')
      .get('/apps/example-app-2/config-vars').reply(200, {
        'REDIS_6_URL': 'redis-user@redis6-example.com',
        'REDIS_6_BASTIONS': 'redis-6-bastion.example.com',
        'REDIS_6_BASTION_KEY': 'key2'
      })

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-sonnet').reply(200, {
        resource_url: 'redis://foobar:password@redis-6.example.com:8649',
        plan: 'private-7',
        prefer_native_tls: true
      })

    await command.run({ app: 'example', flags: { confirm: 'example' }, args: { database: 'redis-sonnet' }, auth: { username: 'foobar', password: 'password' } })
    app.done()
    configVars.done()
    redis.done()

    expect(cli.stdout).to.equal('Connecting to redis-sonnet (REDIS_6_URL):\n')
    expect(cli.stderr).to.equal('')

    const connectArgs = tunnel.connect.args[0]
    expect(connectArgs).to.have.length(1)
    expect(connectArgs[0]).to.deep.equal({
      host: 'redis-6-bastion.example.com',
      privateKey: 'key2',
      username: 'bastion'
    })

    const tunnelArgs = tunnel.forwardOut.args[0]
    const [localAddr, localPort, remoteAddr, remotePort] = tunnelArgs
    expect(localAddr).to.equal('localhost')
    expect(localPort).to.be.a('number')
    expect(remoteAddr).to.equal('redis-6.example.com')
    expect(remotePort).to.equal('8649')

    const tlsConnectArgs = tls.connect.args[0]
    expect(tlsConnectArgs).to.have.length(1)
    const tlsConnectOptions = {
      ...tlsConnectArgs[0]
    }
    delete tlsConnectOptions.socket
    expect(tlsConnectOptions).to.deep.equal({
      port: 8649,
      host: 'redis-6.example.com',
      rejectUnauthorized: false
    })
  })
})
