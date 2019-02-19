import Login from '@heroku-cli/plugin-auth/src/commands/auth/login'
import * as Config from '@oclif/config'
import UserConfig from '../src/user-config'
import nock from 'nock'
import sinon from 'sinon'

import Analytics from '../src/analytics'

describe('analytics', () => {
  it.only('emits analytics event', async () => {
    let backboard = nock('https://backboard.heroku.com')
      .get('/hamurai')
      .reply(200)

    // const mock = sinon.mock(UserConfig)
    // mock.expects('install').once().returns('abcde')

    // sinon.stub(UserConfig, 'install').get(() => 'abcde')

    const config = await Config.load()
    config.platform = "win32"
    config.shell = "fish"
    config.version = "1"
    const analytics = new Analytics(config)
    Login.plugin = {name: "foo", version: "123"} as any
    Login.id = "login"
    await analytics.record({
      Command: Login, argv: ['foo', 'bar']
    })
    backboard.done()
  })
})
