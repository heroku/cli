import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/redis/timeout'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import stripAnsi = require('strip-ansi')
import * as fixtures from '../../../fixtures/addons/fixtures'

import {shouldHandleArgs} from '../../lib/redis/shared.unit.test'

describe('heroku redis:timeout', function () {
  shouldHandleArgs(Cmd, {seconds: '5'})
})

describe('heroku redis:timeout', function () {
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
    await runCommand(Cmd, [
      '--app',
      'example',
      '--seconds',
      '5',
    ])
    expectOutput(stderr.output, '')
    expectOutput(stdout.output, heredoc(`
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
    await runCommand(Cmd, [
      '--app',
      'example',
      '--seconds',
      '0',
    ])
    expectOutput(stderr.output, '')
    expectOutput(stdout.output, heredoc(`
      Timeout for ${redisAddon.name} (REDIS_FOO, REDIS_BAR) set to 0 seconds.
      Connections to the Redis instance can idle indefinitely.
    `))
  })

  it('# errors on missing timeout', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
    ]).catch((error: Error) => {
      expect(stdout.output).to.equal('')
      expect(stripAnsi(error.message)).to.equal(heredoc(`
        The following error occurred:
          Missing required flag seconds
        See more help with --help`))
    })
  })
})
