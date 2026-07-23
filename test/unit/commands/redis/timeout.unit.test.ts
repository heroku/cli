import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/redis/timeout.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

const heredoc = tsheredoc.default

describe('heroku redis:timeout', function () {
  shouldHandleArgs(Cmd, {seconds: '5'})
})

describe('heroku redis:timeout should handle standard arg behavior', function () {
  const redisAddon = {...fixtures.addons['www-redis'], config_vars: ['REDIS_FOO', 'REDIS_BAR']}

  afterEach(function () {
    restore()
  })

  it('# sets the timeout', async function () {
    const resolveByApp = stub().resolves(redisAddon)
    const updateConfig = stub().resolves({timeout: {value: 5}})
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp, updateConfig}}))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--seconds',
      '5',
    ])

    expect(updateConfig.calledOnceWithExactly(redisAddon.name, {timeout: 5})).to.equal(true)
    expectOutput(stderr, '')
    expectOutput(stdout, heredoc(`
      Timeout for ${redisAddon.name} (REDIS_FOO, REDIS_BAR) set to 5 seconds.
      Connections to the Redis instance will be stopped after idling for 5 seconds.
    `))
  })

  it('# sets the timeout to zero', async function () {
    const resolveByApp = stub().resolves(redisAddon)
    const updateConfig = stub().resolves({timeout: {value: 0}})
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp, updateConfig}}))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--seconds',
      '0',
    ])

    expect(updateConfig.calledOnceWithExactly(redisAddon.name, {timeout: 0})).to.equal(true)
    expectOutput(stderr, '')
    expectOutput(stdout, heredoc(`
      Timeout for ${redisAddon.name} (REDIS_FOO, REDIS_BAR) set to 0 seconds.
      Connections to the Redis instance can idle indefinitely.
    `))
  })

  it('# errors on missing timeout', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expect(stdout).to.equal('')
    expect(ansis.strip(error?.message || '')).to.equal(heredoc(`
      The following error occurred:
        Missing required flag seconds
      See more help with --help`))
  })
})
