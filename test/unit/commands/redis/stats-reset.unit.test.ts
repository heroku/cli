import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/redis/stats-reset.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('heroku redis:stats-reset', function () {
  afterEach(function () {
    restore()
  })

  it('# resets the stats of the addon', async function () {
    const redisAddon = fixtures.addons['www-redis']
    const resolveByApp = stub().resolves(redisAddon)
    const resetStats = stub().resolves({message: 'Stats reset successful.'})
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resetStats, resolveByApp}}))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])

    expect(resetStats.calledOnceWithExactly(redisAddon.id)).to.equal(true)
    expectOutput(stdout, '')
    expectOutput(stderr, heredoc(`
      Resetting stats on ${redisAddon.name}... Stats reset successful.
    `))
  })
})
