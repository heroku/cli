import {stdout} from 'stdout-stderr'
import runCommand, {GenericCmd} from '../../../helpers/runCommand'
import {SinonStub} from 'sinon'
import {CLIError} from '@oclif/core/lib/errors'

import * as nock from 'nock'
import * as sinon from 'sinon'
import {noCallThru} from 'proxyquire'
import {expect} from 'chai'
import {Duplex} from 'node:stream'

const EventEmitter = require('events').EventEmitter

class Client extends Duplex {
  _write() {}

  _read() {
    this.emit('end')
  }
}

class Tunnel extends EventEmitter {
  forwardOut = sinon.stub().yields(null, new Client())
  connect = sinon.stub().callsFake(() => this.emit('ready'))
  end = sinon.stub()
}
const addonId = '1dcb269b-8be5-4132-8aeb-e3f3c7364958'
const appId = '7b0ae612-8775-4502-a5b5-2b45a4d18b2d'
describe('heroku redis:cli', () => {
  describe('heroku redis:cli', () => {
    const proxyquire = noCallThru()
    const {default: command} = proxyquire('../../../../src/commands/redis/cli', {net: {}, tls: {}, ssh2: {}})
    require('../../lib/redis/shared.unit.test.ts').shouldHandleArgs(command)
  })

  let command: GenericCmd
  let net: {connect: SinonStub}
  let tls: {connect: SinonStub}
  let tunnel: {forwardOut: SinonStub, connect: SinonStub, end: SinonStub}

  beforeEach(function () {
    net = {
      connect: sinon.stub().returns(new Client()),
    }
    tls = {
      connect: sinon.stub().returns(new Client()),
    }

    const ssh2 = {
      Client: function () {
        tunnel = new Tunnel()
        return tunnel
      },
    }
    const proxyquire = noCallThru()
    const {default: Cmd} = proxyquire('../../../../src/commands/redis/cli', {net, tls, ssh2})
    command = Cmd
  })

  it('# for hobby it uses net.connect', async () => {
    const app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          billing_entity: {
            id: appId, name: 'example',
          },
        },
      ])
    const configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars')
      .reply(200, {FOO: 'BAR'})
    const redis = nock('https://api.data.heroku.com:443')
      .get(`/redis/v0/databases/${addonId}`)
      .reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649', plan: 'hobby',
      })
    await runCommand(command, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])
    app.done()
    configVars.done()
    redis.done()
    const outputParts = stdout.output.split('\n')
    expect(outputParts[0]).to.equal('Connecting to redis-haiku (REDIS_FOO, REDIS_BAR):')
    expect(outputParts[1]).to.equal('')
    expect(outputParts[2]).to.equal('Disconnected from instance.')
    expect(net.connect.called).to.equal(true)
  })

  it('# for hobby it uses TLS if prefer_native_tls', async () => {
    const app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR', 'REDIS_TLS_URL'],
          billing_entity: {
            id: appId, name: 'example',
          },
        },
      ])
    const configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars')
      .reply(200, {REDIS_TLS_URL: 'rediss://foobar:password@example.com:8649'})
    const redis = nock('https://api.data.heroku.com:443')
      .get(`/redis/v0/databases/${addonId}`)
      .reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649', plan: 'hobby', prefer_native_tls: true,
      })
    await runCommand(command, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])
    app.done()
    configVars.done()
    redis.done()
    const outputParts = stdout.output.split('\n')
    expect(outputParts[0]).to.equal('Connecting to redis-haiku (REDIS_FOO, REDIS_BAR, REDIS_TLS_URL):')
    expect(outputParts[1]).to.equal('')
    expect(outputParts[2]).to.equal('Disconnected from instance.')
    expect(tls.connect.called).to.equal(true)
  })

  it('# for premium it uses tls.connect', async () => {
    const app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          billing_entity: {
            id: appId, name: 'example',
          },
        },
      ])
    const configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars')
      .reply(200, {FOO: 'BAR'})
    const redis = nock('https://api.data.heroku.com:443')
      .get(`/redis/v0/databases/${addonId}`)
      .reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649', plan: 'premium-0',
      })
    await runCommand(command, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])
    app.done()
    configVars.done()
    redis.done()
    const outputParts = stdout.output.split('\n')
    expect(outputParts[0]).to.equal('Connecting to redis-haiku (REDIS_FOO, REDIS_BAR):')
    expect(outputParts[1]).to.equal('')
    expect(outputParts[2]).to.equal('Disconnected from instance.')
    expect(tls.connect.called).to.equal(true)
  })

  it('# exits with an error with shield databases', async function () {
    const app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          billing_entity: {
            id: appId, name: 'example',
          },
        },
      ])
    const configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars')
      .reply(200, {FOO: 'BAR'})
    const redis = nock('https://api.data.heroku.com:443')
      .get(`/redis/v0/databases/${addonId}`)
      .reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649', plan: 'shield-9',
      })
    try {
      await runCommand(command, [
        '--app',
        'example',
        '--confirm',
        'example',
      ])
      expect(true, 'cli command should fail!').to.equal(false)
    } catch (error) {
      expect(error).to.be.an.instanceof(CLIError)

      if (error instanceof CLIError) {
        const {oclif: {exit}, message} = error
        expect(exit).to.equal(1)
        expect(message).to.contain('Using redis:cli on Heroku Redis shield plans is not supported.')
      }
    }

    app.done()
    redis.done()
    configVars.done()
  })

  it('# for bastion it uses tunnel.connect', async () => {
    const app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_URL', 'REDIS_BASTIONS', 'REDIS_BASTION_KEY', 'REDIS_BASTION_REKEYS_AFTER'],
          billing_entity: {
            id: appId, name: 'example',
          },
        },
      ])
    const configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars')
      .reply(200, {REDIS_BASTIONS: 'example.com'})
    const redis = nock('https://api.data.heroku.com:443')
      .get(`/redis/v0/databases/${addonId}`)
      .reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649', plan: 'premium-0',
      })

    await runCommand(command, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])

    app.done()
    configVars.done()
    redis.done()
    const outputParts = stdout.output.split('\n')
    expect(outputParts[0]).to.equal('Connecting to redis-haiku (REDIS_URL):')
    expect(outputParts[1]).to.equal('')
    expect(outputParts[2]).to.equal('Disconnected from instance.')
  })

  it('# for private spaces bastion with prefer_native_tls, it uses tls.connect', async () => {
    const app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_URL', 'REDIS_BASTIONS', 'REDIS_BASTION_KEY', 'REDIS_BASTION_REKEYS_AFTER'],
          billing_entity: {
            id: appId, name: 'example',
          },
        },
      ])
    const configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars')
      .reply(200, {REDIS_BASTIONS: 'example.com'})
    const redis = nock('https://api.data.heroku.com:443')
      .get(`/redis/v0/databases/${addonId}`)
      .reply(200, {
        resource_url: 'redis://foobar:password@example.com:8649', plan: 'private-7', prefer_native_tls: true,
      })
    await runCommand(command, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])
    app.done()
    configVars.done()
    redis.done()
    const outputParts = stdout.output.split('\n')
    expect(outputParts[0]).to.equal('Connecting to redis-haiku (REDIS_URL):')
    expect(outputParts[1]).to.equal('')
    expect(outputParts[2]).to.equal('Disconnected from instance.')
    expect(tls.connect.called).to.equal(true)
  })

  it('# selects correct connection information when multiple redises are present across multiple apps', async () => {
    const app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {
          id: addonId,
          name: 'redis-haiku',
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_URL', 'REDIS_BASTIONS', 'REDIS_BASTION_KEY', 'REDIS_BASTION_REKEYS_AFTER'],
          billing_entity: {
            id: appId, name: 'example',
          },
        }, {
          id: 'heroku-redis-addon-id-2',
          name: 'redis-sonnet',
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_6_URL', 'REDIS_6_BASTIONS', 'REDIS_6_BASTION_KEY', 'REDIS_6_BASTION_REKEYS_AFTER'],
          billing_entity: {
            id: 'app-2-id', name: 'example-app-2',
          },
        },
      ])
    const configVars = nock('https://api.heroku.com:443')
      .get('/apps/example-app-2/config-vars')
      .reply(200, {
        REDIS_6_URL: 'redis-user@redis6-example.com',
        REDIS_6_BASTIONS: 'redis-6-bastion.example.com',
        REDIS_6_BASTION_KEY: 'key2',
      })
    const redis = nock('https://api.data.heroku.com:443')
      .get('/redis/v0/databases/heroku-redis-addon-id-2')
      .reply(200, {
        resource_url: 'redis://foobar:password@redis-6.example.com:8649', plan: 'private-7', prefer_native_tls: true,
      })
    await runCommand(command, [
      '--app',
      'example',
      '--confirm',
      'example',
      'redis-sonnet',
    ])
    app.done()
    configVars.done()
    redis.done()
    const outputParts = stdout.output.split('\n')
    expect(outputParts[0]).to.equal('Connecting to redis-sonnet (REDIS_6_URL):')
    expect(outputParts[1]).to.equal('')
    expect(outputParts[2]).to.equal('Disconnected from instance.')
    const connectArgs = tunnel.connect.args[0]
    expect(connectArgs).to.have.length(1)
    expect(connectArgs[0]).to.deep.equal({
      host: 'redis-6-bastion.example.com', privateKey: 'key2', username: 'bastion',
    })
    const tunnelArgs = tunnel.forwardOut.args[0]
    const [localAddr, localPort, remoteAddr, remotePort] = tunnelArgs
    expect(localAddr).to.equal('localhost')
    expect(localPort).to.be.a('number')
    expect(remoteAddr).to.equal('redis-6.example.com')
    expect(remotePort).to.equal(8649)
    const tlsConnectArgs = tls.connect.args[0]
    expect(tlsConnectArgs).to.have.length(1)
    const tlsConnectOptions = {
      ...tlsConnectArgs[0],
    }
    delete tlsConnectOptions.socket
    expect(tlsConnectOptions).to.deep.equal({
      port: 8649, host: 'redis-6.example.com', rejectUnauthorized: false,
    })
  })
})
