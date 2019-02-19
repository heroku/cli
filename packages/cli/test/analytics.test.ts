import Login from '@heroku-cli/plugin-auth/src/commands/auth/login'
import * as Config from '@oclif/config'
import nock from 'nock'
import sinon from 'sinon'

import Analytics from '../src/analytics'
import UserConfig from '../src/user-config'

describe('analytics', () => {
  it('emits analytics event', async () => {
    // mocks
    let backboard = nock('https://backboard.heroku.com/', {
        reqheaders: {
          'user-agent': '@oclif/command/1.5.6 darwin-x64 node-v10.2.1',
        }
      })
      .get('/hamurai?data=eyJzb3VyY2UiOiJjbGkiLCJldmVudCI6ImxvZ2luIiwicHJvcGVydGllcyI6eyJjb21tYW5kIjoibG9naW4iLCJjb21wbGV0aW9uIjowLCJ2ZXJzaW9uIjoiMSIsInBsdWdpbiI6ImZvbyIsInBsdWdpbl92ZXJzaW9uIjoiMTIzIiwib3MiOiJ3aW4zMiIsInNoZWxsIjoiZmlzaCIsInZhbGlkIjp0cnVlLCJsYW5ndWFnZSI6Im5vZGUiLCJpbnN0YWxsX2lkIjoiYWJjZGUifX0=')
      .reply(200)

    // stubs
    const sandbox = sinon.createSandbox()
    sandbox.stub(UserConfig.prototype, 'install').get(() => 'abcde')
    const config = await Config.load()
    config.platform = 'win32'
    config.shell = 'fish'
    config.version = '1'
    config.userAgent = '@oclif/command/1.5.6 darwin-x64 node-v10.2.1'
    const analytics = new Analytics(config)
    Login.plugin = {name: 'foo', version: '123'} as any
    Login.id = 'login'

    await analytics.record({
      Command: Login, argv: ['foo', 'bar']
    })
    backboard.done()
    sandbox.restore()
  })
})
