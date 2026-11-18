import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/redis/credentials.js'
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
        {
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          id: 'b5e0b6ce-1a1d-4f3c-9d1a-6f0e3a2c7d11',
          name: 'redis-haiku',
        },
      ])

    const redis = nock('https://api.data.heroku.com')
      .get('/redis/v0/databases/b5e0b6ce-1a1d-4f3c-9d1a-6f0e3a2c7d11').reply(200, {
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
        {
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          id: 'b5e0b6ce-1a1d-4f3c-9d1a-6f0e3a2c7d11',
          name: 'redis-haiku',
        },
      ])

    const redis = nock('https://api.data.heroku.com')
      .post('/redis/v0/databases/b5e0b6ce-1a1d-4f3c-9d1a-6f0e3a2c7d11/credentials_rotation').reply(200, {})

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
