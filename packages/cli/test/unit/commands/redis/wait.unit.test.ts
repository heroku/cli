import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/redis/wait.js'
import runCommand from '../../../helpers/runCommand.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'
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

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()
    redis.done()

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
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

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()
    redis.done()

    expect(stdout.output).to.equal('')
    expectOutput(stderr.output, 'Waiting for database ⛁ redis-haiku... available')
  })
})
