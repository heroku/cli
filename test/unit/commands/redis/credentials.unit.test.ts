import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import Cmd from '../../../../src/commands/redis/credentials.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

describe('heroku redis:credentials should handle standard arg behavior', function () {
  shouldHandleArgs(Cmd)
})

describe('heroku redis:credentials', function () {
  const addon = {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'}

  afterEach(function () {
    restore()
  })

  it('displays the redis credentials', async function () {
    const resolveByApp = stub().resolves(addon)
    const info = stub().resolves({resource_url: 'redis://foobar:password@hostname:8649'})
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {info, resolveByApp}}))

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])

    expect(resolveByApp.calledOnceWithExactly('example', {database: undefined})).to.equal(true)
    expect(info.calledOnceWithExactly('redis-haiku')).to.equal(true)
    expect(stdout).to.include('redis://foobar:password@hostname:8649')
  })

  it('resets the redis credentials', async function () {
    const resolveByApp = stub().resolves(addon)
    const rotateCredentials = stub().resolves({})
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp, rotateCredentials}}))

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--reset',
    ])

    expect(rotateCredentials.calledOnceWithExactly('redis-haiku')).to.equal(true)
    expect(stdout).to.include('Resetting credentials for redis-haiku')
  })
})
