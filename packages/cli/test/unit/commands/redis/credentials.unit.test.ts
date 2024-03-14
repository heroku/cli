import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/redis/credentials'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test'

describe('heroku redis:credentials', function () {
  shouldHandleArgs(Cmd)
})

describe('heroku redis:credentials', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('displays the redis credentials', async () => {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    const redis = nock('https://api.data.heroku.com')
      .get('/redis/v0/databases/redis-haiku').reply(200, {
        info: [{name: 'Foo', values: ['Bar', 'Biz']}],
        resource_url: 'redis://foobar:password@hostname:8649',
      })

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()
    redis.done()
    expect(stdout.output).to.equal('redis://foobar:password@hostname:8649\n')
    expect(stderr.output).to.equal('')
  })

  it('resets the redis credentials', async () => {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    const redis = nock('https://api.data.heroku.com')
      .post('/redis/v0/databases/redis-haiku/credentials_rotation').reply(200, {})

    await runCommand(Cmd, [
      '--app',
      'example',
      '--reset',
    ])

    api.done()
    redis.done()
    expect(stdout.output).to.equal('Resetting credentials for redis-haiku\n')
    expect(stderr.output).to.equal('')
  })
})
