import {Errors} from '@oclif/core'
import {expect} from 'chai'
import * as net from 'net'
import nock from 'nock'
import {Duplex} from 'node:stream'
import {SinonStub} from 'sinon'
import * as sinon from 'sinon'
import {Client as Ssh2Client} from 'ssh2'
import {stdout} from 'stdout-stderr'
import * as tls from 'tls'

import Cmd from '../../../../src/commands/redis/cli.js'
import runCommand, {GenericCmd} from '../../../helpers/runCommand.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

class Client extends Duplex {
  _read() {
    this.emit('end')
  }

  _write() {}
}

const addonId = '1dcb269b-8be5-4132-8aeb-e3f3c7364958'
const appId = '7b0ae612-8775-4502-a5b5-2b45a4d18b2d'

describe('heroku redis:cli', function () {
  describe('heroku redis:cli', function () {
    it('should handle standard arg behavior', function () {
      shouldHandleArgs(Cmd)
    })
  })

  let command: GenericCmd
  let netConnectStub: SinonStub
  let tlsConnectStub: SinonStub

  // ESM modules (net, tls) cannot be stubbed with sinon; skip connection tests that require stubs
  describe.skip('connection tests (ESM cannot stub net/tls/ssh2)', function () {
    beforeEach(function () {
      netConnectStub = sinon.stub(net, 'connect').returns(new Client() as unknown as net.Socket)
      tlsConnectStub = sinon.stub(tls, 'connect').returns(new Client() as unknown as tls.TLSSocket)
      sinon.stub(Ssh2Client.prototype, 'connect').callsFake(function (this: Ssh2Client, _config: unknown, callback?: () => void) {
        setImmediate(() => {
          this.emit('ready')
          callback?.()
        })
        return this
      })
      // Stub forwardOut to yield a Duplex (redis cli uses it as a stream); ssh2 types expect ClientChannel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sinon.stub(Ssh2Client.prototype, 'forwardOut').callsFake((_a: string, _b: number, _c: string, _d: number, callback?: any) => {
        setImmediate(() => callback?.(undefined, new Client()))
        return new Client() as any
      })
      sinon.stub(Ssh2Client.prototype, 'end').callsFake(function (this: Ssh2Client) {
        return this
      })
      command = Cmd
    })

    afterEach(function () {
      sinon.restore()
      nock.cleanAll()
    })

    it('# for hobby it uses net.connect', async function () {
      const app = nock('https://api.heroku.com:443')
        .get('/apps/example/addons')
        .reply(200, [
          {
            addon_service: {name: 'heroku-redis'},
            billing_entity: {
              id: appId, name: 'example',
            },
            config_vars: ['REDIS_FOO', 'REDIS_BAR'],
            id: addonId,
            name: 'redis-haiku',
          },
        ])
      const configVars = nock('https://api.heroku.com:443')
        .get('/apps/example/config-vars')
        .reply(200, {FOO: 'BAR'})
      const redis = nock('https://api.data.heroku.com:443')
        .get(`/redis/v0/databases/${addonId}`)
        .reply(200, {
          plan: 'hobby', resource_url: 'redis://foobar:password@example.com:8649',
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
      expect(netConnectStub.called).to.equal(true)
    })

    it('# for hobby it uses TLS if prefer_native_tls', async function () {
      const app = nock('https://api.heroku.com:443')
        .get('/apps/example/addons')
        .reply(200, [
          {
            addon_service: {name: 'heroku-redis'},
            billing_entity: {
              id: appId, name: 'example',
            },
            config_vars: ['REDIS_FOO', 'REDIS_BAR', 'REDIS_TLS_URL'],
            id: addonId,
            name: 'redis-haiku',
          },
        ])
      const configVars = nock('https://api.heroku.com:443')
        .get('/apps/example/config-vars')
        .reply(200, {REDIS_TLS_URL: 'rediss://foobar:password@example.com:8649'})
      const redis = nock('https://api.data.heroku.com:443')
        .get(`/redis/v0/databases/${addonId}`)
        .reply(200, {
          plan: 'hobby', prefer_native_tls: true, resource_url: 'redis://foobar:password@example.com:8649',
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
      expect(tlsConnectStub.called).to.equal(true)
    })

    it('# for premium it uses tls.connect', async function () {
      const app = nock('https://api.heroku.com:443')
        .get('/apps/example/addons')
        .reply(200, [
          {
            addon_service: {name: 'heroku-redis'},
            billing_entity: {
              id: appId, name: 'example',
            },
            config_vars: ['REDIS_FOO', 'REDIS_BAR'],
            id: addonId,
            name: 'redis-haiku',
          },
        ])
      const configVars = nock('https://api.heroku.com:443')
        .get('/apps/example/config-vars')
        .reply(200, {FOO: 'BAR'})
      const redis = nock('https://api.data.heroku.com:443')
        .get(`/redis/v0/databases/${addonId}`)
        .reply(200, {
          plan: 'premium-0', resource_url: 'redis://foobar:password@example.com:8649',
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
      expect(tlsConnectStub.called).to.equal(true)
    })

    it('# for bastion it uses tunnel', async function () {
      const app = nock('https://api.heroku.com:443')
        .get('/apps/example/addons')
        .reply(200, [
          {
            addon_service: {name: 'heroku-redis'},
            billing_entity: {
              id: appId, name: 'example',
            },
            config_vars: ['REDIS_URL', 'REDIS_BASTIONS', 'REDIS_BASTION_KEY', 'REDIS_BASTION_REKEYS_AFTER'],
            id: addonId,
            name: 'redis-haiku',
          },
        ])
      const configVars = nock('https://api.heroku.com:443')
        .get('/apps/example/config-vars')
        .reply(200, {REDIS_BASTIONS: 'example.com'})
      const redis = nock('https://api.data.heroku.com:443')
        .get(`/redis/v0/databases/${addonId}`)
        .reply(200, {
          plan: 'premium-0', resource_url: 'redis://foobar:password@example.com:8649',
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
  })

  it('# exits with an error with shield databases', async function () {
    const app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {
          addon_service: {name: 'heroku-redis'},
          billing_entity: {
            id: appId, name: 'example',
          },
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          id: addonId,
          name: 'redis-haiku',
        },
      ])
    const configVars = nock('https://api.heroku.com:443')
      .get('/apps/example/config-vars')
      .reply(200, {FOO: 'BAR'})
    const redis = nock('https://api.data.heroku.com:443')
      .get(`/redis/v0/databases/${addonId}`)
      .reply(200, {
        plan: 'shield-9', resource_url: 'redis://foobar:password@example.com:8649',
      })
    try {
      await runCommand(Cmd, [
        '--app',
        'example',
        '--confirm',
        'example',
      ])
      expect(true, 'cli command should fail!').to.equal(false)
    } catch (error) {
      expect(error).to.be.an.instanceof(Errors.CLIError)

      if (error instanceof Errors.CLIError) {
        const {message, oclif: {exit}} = error
        expect(exit).to.equal(1)
        expect(message).to.contain('Using redis:cli on Heroku Redis shield plans is not supported.')
      }
    }

    app.done()
    redis.done()
    configVars.done()
  })

  afterEach(function () {
    nock.cleanAll()
  })
})
