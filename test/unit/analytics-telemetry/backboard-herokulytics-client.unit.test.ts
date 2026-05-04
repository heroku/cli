import {Config} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import AnalyticsCommand, {AnalyticsInterface} from '../../../src/lib/analytics-telemetry/backboard-herokulytics-client.js'
import HerokulyticsConfig from '../../../src/lib/analytics-telemetry/herokulytics-config.js'
import {stubCredentialManager} from '../../helpers/credential-manager-stub.js'

const mockCommand = {
  plugin: {
    name: 'foo',
    version: '123',
  },
  id: 'login',
}

const mockInvalidCommand = {
  id: 'login',
}

function createBackboardMock(expectedGetter: (data: AnalyticsInterface) => any, actual: any) {
  const backboard = nock('https://backboard.heroku.com/', {
    reqheaders: {
      'user-agent': '@oclif/command/1.5.6 darwin-x64 node-v10.2.1',
    },
  })
    .get('/hamurai')
    .query(({data: analyticsData}) => {
      const data: AnalyticsInterface = JSON.parse(Buffer.from(analyticsData as string, 'base64').toString())
      const expected = expectedGetter(data)
      expect(expected).to.eq(actual)
      return true
    })
    .reply(200)

  return backboard
}

async function runAnalyticsTest(expectedCbk: (data: AnalyticsInterface) => any, actual: any) {
  const config = await Config.load()
  config.platform = 'win32'
  config.shell = 'fish'
  config.version = '1'
  config.userAgent = '@oclif/command/1.5.6 darwin-x64 node-v10.2.1'
  config.name = 'heroku'
  const analytics = new AnalyticsCommand(config)

  const backboard = createBackboardMock(expectedCbk, actual)
  await analytics.send({
    Command: mockCommand as any, argv: ['foo', 'bar'],
  })
  backboard.done()
}

describe('analytics (error handling)', function () {
  let sandbox: any

  before(async function () {
    sandbox = sinon.createSandbox()
    sandbox.stub(HerokulyticsConfig.prototype, 'install').get(() => 'abcde')
  })

  after(function () {
    sandbox.restore()
  })

  it('does not show an error on console when backboard has an error (with authorizationToken)', async function () {
    const credentialManagerStub = stubCredentialManager({
      getAuth: () => Promise.resolve({account: 'test@example.com', token: 'test-token'}),
    })

    const backboard = nock('https://backboard.heroku.com/', {
      reqheaders: {authorization: 'Bearer test-token'},
    })
      .get('/hamurai')
      .query(() => true)
      .reply(500)

    const config = await Config.load()
    config.platform = 'win32'
    config.shell = 'fish'
    config.version = '1'
    config.userAgent = '@oclif/command/1.5.6 darwin-x64 node-v10.2.1'
    config.name = 'heroku'
    const analytics = new AnalyticsCommand(config)

    try {
      await analytics.send({
        Command: mockCommand as any, argv: ['foo', 'bar'],
      })
    } catch {
      throw new Error('Expected analytics.send to catch error')
    } finally {
      backboard.done()
      credentialManagerStub.restore()
    }
  })

  it('does not show an error on console when backboard has an error (without authorizationToken)', async function () {
    const credentialManagerStub = stubCredentialManager({
      getAuth: () => Promise.resolve({account: undefined, token: undefined}),
    })

    const backboard = nock('https://backboard.heroku.com/', {
      badheaders: ['authorization'],
    })
      .get('/hamurai')
      .query(() => true)
      .reply(500)

    const config = await Config.load()
    config.platform = 'win32'
    config.shell = 'fish'
    config.version = '1'
    config.userAgent = '@oclif/command/1.5.6 darwin-x64 node-v10.2.1'
    config.name = 'heroku'
    const analytics = new AnalyticsCommand(config)

    try {
      await analytics.send({
        Command: mockCommand as any, argv: ['foo', 'bar'],
      })
    } catch {
      throw new Error('Expected analytics.send to catch error')
    } finally {
      backboard.done()
      credentialManagerStub.restore()
    }
  })

  it('does not record if plugin is not present', async function () {
    const config = await Config.load()
    config.platform = 'win32'
    config.shell = 'fish'
    config.version = '1'
    config.userAgent = '@oclif/command/1.5.6 darwin-x64 node-v10.2.1'
    config.name = 'heroku'
    const analytics = new AnalyticsCommand(config)

    try {
      await analytics.send({
        Command: mockInvalidCommand as any, argv: ['foo', 'bar'],
      })
    } catch {
      throw new Error('Expected analytics.send to catch error')
    }
  })
})

describe('analytics', function () {
  let sandbox: any

  before(async function () {
    sandbox = sinon.createSandbox()
    sandbox.stub(HerokulyticsConfig.prototype, 'install').get(() => 'abcde')
  })

  after(function () {
    sandbox.restore()
  })

  it('emits source', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.source, 'cli')
  })

  it('emits event', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.event, 'login')
  })

  it('emits property cli', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.properties.cli, 'heroku')
  })

  it('emits property command', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.properties.command, 'login')
  })

  it('emits property completion', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.properties.completion, 0)
  })

  it('emits property version', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.properties.version, '1')
  })

  it('emits property plugin', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.properties.plugin, 'foo')
  })

  it('emits property plugin_version', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.properties.plugin_version, '123')
  })

  it('emits property os', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.properties.os, 'win32')
  })

  it('emits property shell', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.properties.shell, 'fish')
  })

  it('emits property valid', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.properties.valid, true)
  })

  it('emits property language', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.properties.language, 'node')
  })

  it('emits property install_id', async function () {
    await runAnalyticsTest((d: AnalyticsInterface) => d.properties.install_id, 'abcde')
  })

  it('includes MCP version in version string when in MCP mode', async function () {
    const originalMcpMode = process.env.HEROKU_MCP_MODE
    const originalMcpVersion = process.env.HEROKU_MCP_SERVER_VERSION
    process.env.HEROKU_MCP_MODE = 'true'
    process.env.HEROKU_MCP_SERVER_VERSION = '1.2.3'

    try {
      await runAnalyticsTest(
        (d: AnalyticsInterface) => d.properties.version,
        '1 (MCP 1.2.3)', // '1' is the version set in runAnalyticsTest
      )
    } finally {
      process.env.HEROKU_MCP_MODE = originalMcpMode
      process.env.HEROKU_MCP_SERVER_VERSION = originalMcpVersion
    }
  })
})
