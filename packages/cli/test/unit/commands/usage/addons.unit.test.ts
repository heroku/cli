import {stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/usage/addons'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import runCommand from '../../../helpers/runCommand'
import * as fixtures from '../../../fixtures/addons/fixtures'
import * as Heroku from '@heroku-cli/schema'

describe('usage:addons', function () {
  let redisAddon: Heroku.AddOn

  beforeEach(function () {
    redisAddon = fixtures.addons['www-redis']
    nock.cleanAll()
  })

  it('shows usage for metered addons', async function () {
    const app = 'myapp'
    const usage = {
      addons: [{
        id: 'redis-123',
        meters: {
          'Data Storage': {
            quantity: 2.5,
          },
          Connections: {
            quantity: 100,
          },
        },
      }],
    }

    nock('https://api.heroku.com')
      .get(`/apps/${app}/usage`)
      .reply(200, usage)

    nock('https://api.heroku.com')
      .get(`/apps/${app}/addons`)
      .reply(200, [redisAddon])

    await runCommand(Cmd, [
      '--app',
      app,
    ])

    expectOutput(stdout.output, heredoc(`
      === Usage for ⬢ ${app}
       Addon     Meter        Quantity
       ───────── ──────────── ────────
       redis-123 Data Storage 2.5
       redis-123 Connections  100
    `))
  })

  it('handles apps with no usage', async function () {
    const app = 'myapp'
    const usage = {
      addons: [],
    }

    nock('https://api.heroku.com')
      .get(`/apps/${app}/usage`)
      .reply(200, usage)

    nock('https://api.heroku.com')
      .get(`/apps/${app}/addons`)
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      app,
    ])

    expectOutput(stdout.output, `No usage found for ${app}`)
  })
})
