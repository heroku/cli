import Login from '@heroku-cli/plugin-auth/lib/commands/auth/login'
import * as Config from '@oclif/config'
import nock from 'nock'

import Analytics from '../src/analytics'

const wait = (ms = 100) => new Promise(cb => setTimeout(cb, ms))

describe('analytics', () => {
  it('emits analytics event', async () => {
    let backboard = nock('https://backboard.heroku.com')
      .get('/hamurai')
      .reply(200)

    const config = await Config.load()
    const analytics = new Analytics(config)
    Login.plugin = {} as any
    analytics.record({Command: Login, argv: ['foo', 'bar']})
    await wait(100)

    backboard.done()
  })
})
