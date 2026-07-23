import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import Cmd from '../../../../src/commands/redis/keyspace-notifications.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

describe('heroku redis:keyspace-notifications should handle standard arg behavior', function () {
  shouldHandleArgs(Cmd, {config: 'A'})
})

describe('heroku redis:keyspace-notifications', function () {
  const addon = {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'}

  afterEach(function () {
    restore()
  })

  it('# sets the keyspace notify events', async function () {
    const resolveByApp = stub().resolves(addon)
    const updateConfig = stub().resolves({
      notify_keyspace_events: {default: '', desc: 'Enables keyspace notifications.', value: 'AKE'},
    })
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp, updateConfig}}))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--config',
      'AKE',
    ])

    expect(resolveByApp.calledOnceWithExactly('example', {database: undefined})).to.equal(true)
    expect(updateConfig.calledOnceWithExactly('redis-haiku', {notify_keyspace_events: 'AKE'})).to.equal(true)
    expect(stdout).to.equal("Keyspace notifications for redis-haiku (REDIS_FOO, REDIS_BAR) set to 'AKE'.\n")
    expect(stderr).to.equal('')
  })
})
