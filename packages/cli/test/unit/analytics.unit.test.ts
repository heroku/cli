import {Config} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import netrc from 'netrc-parser'
import {vars} from '@heroku-cli/command'

import AnalyticsCommand, {AnalyticsInterface} from '../../src/analytics'
import UserConfig from '../../src/user-config'

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
    .query(({data: analyticsData}: { data: string }) => {
      const data: AnalyticsInterface = JSON.parse(Buffer.from(analyticsData, 'base64').toString())
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
  await analytics.record({
    Command: mockCommand as any, argv: ['foo', 'bar'],
  })
  backboard.done()
}

describe('analytics (backboard has an error) with authorizationToken', () => {
  let sandbox: any

  before(async () => {
    sandbox = sinon.createSandbox()
    sandbox.stub(UserConfig.prototype, 'install').get(() => 'abcde')
  })

  it('does not show an error on console', async () => {
    const backboard = nock('https://backboard.heroku.com/')
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
      await analytics.record({
        Command: mockCommand as any, argv: ['foo', 'bar'],
      })
    } catch {
      throw new Error('Expected analytics hook to 🦃 error')
    } finally {
      backboard.done()
    }
  })

  it('does not record if plugin is not present', async () => {
    const config = await Config.load()
    config.platform = 'win32'
    config.shell = 'fish'
    config.version = '1'
    config.userAgent = '@oclif/command/1.5.6 darwin-x64 node-v10.2.1'
    config.name = 'heroku'
    const analytics = new AnalyticsCommand(config)

    try {
      await analytics.record({
        Command: mockInvalidCommand as any, argv: ['foo', 'bar'],
      })
    } catch {
      throw new Error('Expected analytics hook to 🦃 error')
    }
  })

  describe('analytics (backboard has an error) without authorizationToken', () => {
    let sandbox: any
    let analyticsSandbox: any

    before(async () => {
      sandbox = sinon.createSandbox()
      sandbox.stub(UserConfig.prototype, 'install').get(() => 'abcde')
      analyticsSandbox = sinon.createSandbox()
      analyticsSandbox.stub(AnalyticsCommand.prototype, 'netrcToken').get(() => '')
    })

    it('does not show an error on console', async () => {
      const backboard = nock('https://backboard.heroku.com/')
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
        await analytics.record({
          Command: mockCommand as any, argv: ['foo', 'bar'],
        })
      } catch {
        throw new Error('Expected analytics hook to 🦃 error')
      } finally {
        backboard.done()
      }
    })
  })

  describe('analytics', () => {
    let sandbox: any

    before(async () => {
      sandbox = sinon.createSandbox()
      sandbox.stub(UserConfig.prototype, 'install').get(() => 'abcde')
    })

    it('emits source', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.source, 'cli')
    })

    it('emits event', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.event, 'login')
    })

    it('emits property cli', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.properties.cli, 'heroku')
    })

    it('emits property command', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.properties.command, 'login')
    })

    it('emits property completion', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.properties.completion, 0)
    })

    it('emits property version', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.properties.version, '1')
    })

    it('emits property plugin', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.properties.plugin, 'foo')
    })

    it('emits property plugin_version', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.properties.plugin_version, '123')
    })

    it('emits property os', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.properties.os, 'win32')
    })

    it('emits property shell', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.properties.shell, 'fish')
    })

    it('emits property valid', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.properties.valid, true)
    })

    it('emits property language', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.properties.language, 'node')
    })

    it('emits property install_id', async () => {
      await runAnalyticsTest((d: AnalyticsInterface) => d.properties.install_id, 'abcde')
    })

    after(() => {
      sandbox.restore()
    })
  })

  describe('analytics additional methods', () => {
    let user: any
    beforeEach(() => {
      process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
      user = netrc.machines[vars.apiHost]?.login || undefined
    })

    it('retreives user heroku API key', async () => {
      const config = await Config.load()
      config.platform = 'win32'
      config.shell = 'fish'
      config.version = '1'
      config.userAgent = '@oclif/command/1.5.6 darwin-x64 node-v10.2.1'
      config.name = 'heroku'
      const analytics = new AnalyticsCommand(config)
      const usingHerokuAPIKeyResult = analytics.usingHerokuAPIKey
      const netrcLoginResult = analytics.netrcLogin
      let userResult = analytics.user

      expect(usingHerokuAPIKeyResult).to.equal(true)
      expect(netrcLoginResult).to.equal(user)

      // The result will be undefined since
      // the method being accessed returns
      // if the heroku API env var is present
      expect(userResult).to.equal(undefined)

      // Remove heroku API env var
      delete process.env.HEROKU_API_KEY
      userResult = analytics.user
      expect(userResult).to.equal(user)
    })
  })
})
