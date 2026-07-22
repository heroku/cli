import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import Cmd from '../../../../src/commands/redis/promote.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

describe('heroku redis:promote should handle standard arg behavior', function () {
  shouldHandleArgs(Cmd)
})

describe('heroku redis:promote', function () {
  afterEach(function () {
    restore()
  })

  it('# promotes', async function () {
    const silver = {
      addon_service: {name: 'heroku-redis'},
      config_vars: ['REDIS_URL', 'HEROKU_REDIS_SILVER_URL'],
      name: 'redis-silver-haiku',
    }
    const gold = {
      addon_service: {name: 'heroku-redis'},
      config_vars: ['HEROKU_REDIS_GOLD_URL'],
      name: 'redis-gold-haiku',
    }

    const resolveByApp = stub().resolves(gold)
    const listByApp = stub().resolves([silver, gold])
    const create = stub().resolves({})
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp}}))
    stub(HerokuSDK.prototype, 'platform').get(() => ({
      addOn: {listByApp},
      addOnAttachment: {create},
    }))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      'redis-gold-haiku',
    ])

    expect(create.calledOnceWithExactly({
      addon: 'redis-gold-haiku',
      app: 'example',
      confirm: 'example',
      name: 'REDIS',
    })).to.equal(true)
    expect(stdout).to.equal('Promoting redis-gold-haiku to REDIS_URL on example\n')
    expect(stderr).to.equal('')
  })

  it('# promotes and replaces attachment of existing REDIS_URL if necessary', async function () {
    const silver = {
      addon_service: {name: 'heroku-redis'},
      config_vars: [
        'REDIS_URL',
        'REDIS_BASTIONS',
        'REDIS_BASTION_KEY',
        'REDIS_BASTION_REKEYS_AFTER',
      ],
      name: 'redis-silver-haiku',
    }
    const gold = {
      addon_service: {name: 'heroku-redis'},
      config_vars: ['HEROKU_REDIS_GOLD_URL'],
      name: 'redis-gold-haiku',
    }

    const resolveByApp = stub().resolves(gold)
    const listByApp = stub().resolves([silver, gold])
    const create = stub().resolves({})
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp}}))
    stub(HerokuSDK.prototype, 'platform').get(() => ({
      addOn: {listByApp},
      addOnAttachment: {create},
    }))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      'redis-gold-haiku',
    ])

    expect(create.calledTwice).to.equal(true)
    expect(create.firstCall.calledWithExactly({
      addon: 'redis-silver-haiku',
      app: 'example',
      confirm: 'example',
    })).to.equal(true)
    expect(create.secondCall.calledWithExactly({
      addon: 'redis-gold-haiku',
      app: 'example',
      confirm: 'example',
      name: 'REDIS',
    })).to.equal(true)
    expect(stdout).to.equal('Promoting redis-gold-haiku to REDIS_URL on example\n')
    expect(stderr).to.equal('')
  })
})
