import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/redis/wait.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

describe('heroku redis:wait', function () {
  shouldHandleArgs(Cmd)
})

describe('heroku redis:wait ', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('# returns when waiting? is false', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons')
      .reply(200, [
        {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_URL'], name: 'redis-haiku'},
      ])
    const redis = nock('https://api.data.heroku.com')
      .get('/redis/v0/databases/redis-haiku/wait')
      .reply(200, {'waiting?': false})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])
    api.done()
    redis.done()

    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
  })

  it('# waits for version upgrade', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons')
      .reply(200, [
        {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_URL'], name: 'redis-haiku'},
      ])
    const redis = nock('https://api.data.heroku.com')
      .get('/redis/v0/databases/redis-haiku/wait')
      .reply(200, {message: 'upgrading version', 'waiting?': true})
      .get('/redis/v0/databases/redis-haiku/wait')
      .reply(200, {message: 'available', 'waiting?': false})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])
    api.done()
    redis.done()

    expect(stdout).to.equal('')
    expectOutput(stderr, 'Waiting for database ⛁ redis-haiku... available')
  })
})
