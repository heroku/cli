import * as Config from '@oclif/config'
import AnalyticsCommand, {AnalyticsInterface} from '../src/analytics'
import Login from '@heroku-cli/plugin-auth/src/commands/auth/login'
import UserConfig from '../src/user-config'
import nock from 'nock'
import sinon from 'sinon'
import {expect} from 'chai'

describe('analytics', () => {
  it('emits analytics event', async () => {
    // mocks
    let backboard = nock('https://backboard.heroku.com/', {
      reqheaders: {
        'user-agent': '@oclif/command/1.5.6 darwin-x64 node-v10.2.1',
      }
    })
      .get('/hamurai')
      .query(({data: analyticsData}: {data: string}) => {
        const data: AnalyticsInterface = JSON.parse(Buffer.from(analyticsData, 'base64').toString())

        expect(data.source).to.eq('cli')
        expect(data.event).to.eq('login')
        expect(data.properties.cli).to.eq('heroku')
        expect(data.properties.command).to.eq('login')
        expect(data.properties.completion).to.eq(0)
        expect(data.properties.version).to.eq('1')
        expect(data.properties.plugin).to.eq('foo')
        expect(data.properties.plugin_version).to.eq('123')
        expect(data.properties.os).to.eq('win32')
        expect(data.properties.shell).to.eq('fish')
        expect(data.properties.valid).to.eq(true)
        expect(data.properties.language).to.eq('node')
        expect(data.properties.install_id).to.eq('abcde')

        return true
      })
      .reply(200)

    // stubs
    const sandbox = sinon.createSandbox()
    sandbox.stub(UserConfig.prototype, 'install').get(() => 'abcde')
    const config = await Config.load()
    config.platform = 'win32'
    config.shell = 'fish'
    config.version = '1'
    config.userAgent = '@oclif/command/1.5.6 darwin-x64 node-v10.2.1'
    config.name = 'heroku'
    const analytics = new AnalyticsCommand(config)
    Login.plugin = {name: 'foo', version: '123'} as any
    Login.id = 'login'

    await analytics.record({
      Command: Login, argv: ['foo', 'bar']
    })
    backboard.done()
    sandbox.restore()
  })
})
