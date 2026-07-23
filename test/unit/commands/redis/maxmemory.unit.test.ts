import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/redis/maxmemory.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

const heredoc = tsheredoc.default

describe('heroku redis:maxmemory should handle standard arg behavior', function () {
  shouldHandleArgs(Cmd, {policy: 'noeviction'})
})

describe('heroku redis:maxmemory', function () {
  const addon = {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'}

  afterEach(function () {
    restore()
  })

  it('# sets the key eviction policy', async function () {
    const resolveByApp = stub().resolves(addon)
    const updateConfig = stub().resolves({
      maxmemory_policy: {value: 'noeviction', values: {noeviction: 'return errors when memory limit is reached'}},
    })
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp, updateConfig}}))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--policy',
      'noeviction',
    ])

    expect(resolveByApp.calledOnceWithExactly('example', {database: undefined})).to.equal(true)
    expect(updateConfig.calledOnceWithExactly('redis-haiku', {maxmemory_policy: 'noeviction'})).to.equal(true)
    expectOutput(stderr, '')
    expectOutput(stdout, heredoc(`
      Maxmemory policy for redis-haiku (REDIS_FOO, REDIS_BAR) set to noeviction.
      noeviction return errors when memory limit is reached.
    `))
  })

  it('# errors on missing eviction policy', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
    ]).catch(function (error: Error) {
      expect(ansis.strip(error.message)).to.equal(heredoc(`
        The following error occurred:
          Missing required flag policy
        See more help with --help`))
    })
  })
})
