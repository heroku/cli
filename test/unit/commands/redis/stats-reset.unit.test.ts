import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'

import * as fixtures from '../../../fixtures/addons/fixtures.js'
// import Cmd from '../../../../src/commands/redis/stats-reset'
import runCommand from '../../../helpers/runCommand.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

/*
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
    await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])
    expectOutput(stdout.output, '')
    expectOutput(stderr.output, heredoc(`
      Resetting stats on ${redisAddon.name}...
      Resetting stats on ${redisAddon.name}... Stats reset successful.
    `))
  })
})

*/
