import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/redis/credentials.js'
import {runCommand} from '../../../helpers/run-command.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

describe('heroku redis:credentials should handle standard arg behavior', function () {
  shouldHandleArgs(Cmd)
})

describe('heroku redis:credentials', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('displays the redis credentials', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons').reply(200, [
        {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'},
      ])

    const redis = nock('https://api.data.heroku.com')
      .get('/redis/v0/databases/redis-haiku').reply(200, {
        info: [{name: 'Foo', values: ['Bar', 'Biz']}],
        resource_url: 'redis://foobar:password@hostname:8649',
      })

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])
    api.done()
    redis.done()
    expect(stdout).to.include('redis://foobar:password@hostname:8649')
  })

  it('resets the redis credentials', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons').reply(200, [
        {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'},
      ])

    const redis = nock('https://api.data.heroku.com')
      .post('/redis/v0/databases/redis-haiku/credentials_rotation').reply(200, {})

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--reset',
    ])
    api.done()
    redis.done()
    expect(stdout).to.include('Resetting credentials for redis-haiku')
  })
})
