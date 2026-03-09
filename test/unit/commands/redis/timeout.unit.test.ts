import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/redis/timeout.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import {runCommand} from '../../../helpers/run-command.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

const heredoc = tsheredoc.default

describe('heroku redis:timeout', function () {
  shouldHandleArgs(Cmd, {seconds: '5'})
})

describe('heroku redis:timeout should handle standard arg behavior', function () {
  const redisAddon = fixtures.addons['www-redis']

  beforeEach(function () {
    nock.cleanAll()
    redisAddon.config_vars = ['REDIS_FOO', 'REDIS_BAR']
  })

  it('# sets the timeout', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        redisAddon,
      ])
    nock('https://api.data.heroku.com:443')
      .patch(`/redis/v0/databases/${redisAddon.id}/config`, {timeout: 5})
      .reply(200, {
        timeout: {value: 5},
      })
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--seconds',
      '5',
    ])
    expectOutput(stderr, '')
    expectOutput(stdout, heredoc(`
      Timeout for ${redisAddon.name} (REDIS_FOO, REDIS_BAR) set to 5 seconds.
      Connections to the Redis instance will be stopped after idling for 5 seconds.
    `))
  })

  it('# sets the timeout to zero', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        redisAddon,
      ])
    nock('https://api.data.heroku.com:443')
      .patch(`/redis/v0/databases/${redisAddon.id}/config`, {timeout: 0})
      .reply(200, {
        timeout: {value: 0},
      })
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--seconds',
      '0',
    ])
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
