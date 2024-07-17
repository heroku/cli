import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/redis/wait'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test'

describe('heroku redis:credentials', function () {
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
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_URL']},
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
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_URL']},
      ])
    const redis = nock('https://api.data.heroku.com')
      .get('/redis/v0/databases/redis-haiku/wait')
      .reply(200, {'waiting?': true, message: 'upgrading version'})
      .get('/redis/v0/databases/redis-haiku/wait')
      .reply(200, {'waiting?': false, message: 'available'})

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()
    redis.done()

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('Waiting for database redis-haiku... upgrading version\nWaiting for database redis-haiku... available\n')
  })
})
