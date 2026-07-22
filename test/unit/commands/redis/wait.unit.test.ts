import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import Cmd from '../../../../src/commands/redis/wait.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

describe('heroku redis:wait', function () {
  shouldHandleArgs(Cmd)
})

describe('heroku redis:wait ', function () {
  const addon = {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_URL'], name: 'redis-haiku'}

  afterEach(function () {
    restore()
  })

  it('# returns when waiting? is false', async function () {
    const resolveByApp = stub().resolves(addon)
    const wait = stub().resolves({'waiting?': false})
    const waitForReady = stub()
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp, wait, waitForReady}}))

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])

    expect(waitForReady.called).to.equal(false)
    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
  })

  it('# waits for version upgrade', async function () {
    const resolveByApp = stub().resolves(addon)
    const wait = stub().resolves({message: 'upgrading version', 'waiting?': true})
    const waitForReady = stub().resolves({message: 'available', 'waiting?': false})
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp, wait, waitForReady}}))

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])

    expect(waitForReady.calledOnce).to.equal(true)
    expect(waitForReady.firstCall.args[0]).to.equal('redis-haiku')
    expect(waitForReady.firstCall.args[1]).to.deep.equal({intervalMs: 5000})
    expect(stdout).to.equal('')
    expectOutput(stderr, 'Waiting for database ⛁ redis-haiku... available')
  })
})
