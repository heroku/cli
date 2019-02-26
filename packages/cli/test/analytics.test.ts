import Login from '@heroku-cli/plugin-auth/src/commands/auth/login'
import * as Config from '@oclif/config'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import AnalyticsCommand, {AnalyticsInterface} from '../src/analytics'
import UserConfig from '../src/user-config'

function createBackboardMock(expectedGetter: (data: AnalyticsInterface) => any, actual: any) {
  let backboard = nock('https://backboard.heroku.com/', {
    reqheaders: {
      'user-agent': '@oclif/command/1.5.6 darwin-x64 node-v10.2.1',
    }
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
  Login.plugin = {name: 'foo', version: '123'} as any
  Login.id = 'login'

  let backboard = createBackboardMock(expectedCbk, actual)
  await analytics.record({
    Command: Login, argv: ['foo', 'bar']
  })
  backboard.done()
}

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
