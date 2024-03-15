import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/redis/keyspace-notifications'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test'

describe('heroku redis:keyspace-notifications', function () {
  shouldHandleArgs(Cmd, {config: 'A'})
})

describe('heroku redis:keyspace-notifications', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('# sets the keyspace notify events', async () => {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])

    const redis = nock('https://api.data.heroku.com')
      .patch('/redis/v0/databases/redis-haiku/config', {notify_keyspace_events: 'AKE'}).reply(200, {
        notify_keyspace_events: {value: 'AKE', desc: 'Enables keyspace notifications.', default: ''},
      })

    await runCommand(Cmd, [
      '--app',
      'example',
      '--config',
      'AKE',
    ])

    api.done()
    redis.done()
    expect(stdout.output).to.equal("Keyspace notifications for redis-haiku (REDIS_FOO, REDIS_BAR) set to 'AKE'.\n")
    expect(stderr.output).to.equal('')
  })
})
