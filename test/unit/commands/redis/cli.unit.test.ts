import {type GenericCmd, runCommand} from '@heroku-cli/test-utils'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import {Duplex} from 'node:stream'

import Cmd from '../../../../src/commands/redis/cli.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

class Client extends Duplex {
  _read() {
    this.emit('end')
  }

  _write() {}
}

const addonId = '1dcb269b-8be5-4132-8aeb-e3f3c7364958'
const appId = '7b0ae612-8775-4502-a5b5-2b45a4d18b2d'

const connectionTypes: string[] = []
const portOffsets: (number | undefined)[] = []

class TestCli extends Cmd {
  protected override async createBastionConnection() {
    connectionTypes.push('bastion')
    return new Client()
  }

  protected override createDirectConnection(_uri: URL, options: {portOffset?: number, useTls: boolean}) {
    connectionTypes.push(options.useTls ? 'tls' : 'net')
    portOffsets.push(options.portOffset)
    return new Client() as unknown as ReturnType<Cmd['createDirectConnection']>
  }
}

describe('heroku redis:cli', function () {
  describe('heroku redis:cli', function () {
    it('should handle standard arg behavior', function () {
      shouldHandleArgs(Cmd)
    })
  })

  describe('connection tests', function () {
    beforeEach(function () {
      connectionTypes.length = 0
      portOffsets.length = 0
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
      const {stdout} = await runCommand(TestCli as GenericCmd, [
        '--app',
        'example',
        '--confirm',
        'example',
      ])
      app.done()
      configVars.done()
      redis.done()
      const outputParts = stdout.split('\n')
      expect(outputParts[0]).to.equal('Connecting to redis-haiku (REDIS_FOO, REDIS_BAR):')
      expect(outputParts[1]).to.equal('')
      expect(outputParts[2]).to.equal('Disconnected from instance.')
      expect(connectionTypes).to.include('net')
      expect(portOffsets).to.have.lengthOf(1)
      expect(portOffsets[0]).to.equal(undefined)
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
      const {stdout} = await runCommand(TestCli as GenericCmd, [
        '--app',
        'example',
        '--confirm',
        'example',
      ])
      app.done()
      configVars.done()
      redis.done()
      const outputParts = stdout.split('\n')
      expect(outputParts[0]).to.equal('Connecting to redis-haiku (REDIS_FOO, REDIS_BAR, REDIS_TLS_URL):')
      expect(outputParts[1]).to.equal('')
      expect(outputParts[2]).to.equal('Disconnected from instance.')
      expect(connectionTypes).to.include('tls')
      expect(portOffsets).to.have.lengthOf(1)
      expect(portOffsets[0]).to.equal(undefined)
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
      const {stdout} = await runCommand(TestCli as GenericCmd, [
        '--app',
        'example',
        '--confirm',
        'example',
      ])
      app.done()
      configVars.done()
      redis.done()
      const outputParts = stdout.split('\n')
      expect(outputParts[0]).to.equal('Connecting to redis-haiku (REDIS_FOO, REDIS_BAR):')
      expect(outputParts[1]).to.equal('')
      expect(outputParts[2]).to.equal('Disconnected from instance.')
      expect(connectionTypes).to.include('tls')
      expect(portOffsets).to.have.lengthOf(1)
      expect(portOffsets[0]).to.equal(1)
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

      const {stdout} = await runCommand(TestCli as GenericCmd, [
        '--app',
        'example',
        '--confirm',
        'example',
      ])
      app.done()
      configVars.done()
      redis.done()
      const outputParts = stdout.split('\n')
      expect(outputParts[0]).to.equal('Connecting to redis-haiku (REDIS_URL):')
      expect(outputParts[1]).to.equal('')
      expect(outputParts[2]).to.equal('Disconnected from instance.')
      expect(connectionTypes).to.include('bastion')
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
    const {error} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])
    expect(error, 'cli command should fail!').to.exist
    expect(error).to.be.an.instanceof(Errors.CLIError)

    if (error instanceof Errors.CLIError) {
      const {message, oclif: {exit}} = error
      expect(exit).to.equal(1)
      expect(message).to.contain('Using redis:cli on Heroku Redis shield plans is not supported.')
    }

    app.done()
    redis.done()
    configVars.done()
  })

  afterEach(function () {
    nock.cleanAll()
  })
})
