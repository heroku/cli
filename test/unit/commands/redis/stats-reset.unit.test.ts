import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/redis/stats-reset.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('heroku redis:stats-reset', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  it('# resets the stats of the addon', async function () {
    const redisAddon =  fixtures.addons['www-redis']

    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        redisAddon,
      ])
    nock('https://api.data.heroku.com:443')
      .post(`/redis/v0/databases/${redisAddon.id}/stats/reset`)
      .reply(200, {
        message: 'Stats reset successful.',
      })
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])
    expectOutput(stdout, '')
    expectOutput(stderr, heredoc(`
      Resetting stats on ${redisAddon.name}... Stats reset successful.
    `))
  })
})
