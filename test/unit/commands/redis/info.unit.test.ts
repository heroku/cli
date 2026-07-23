import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {NotFoundError} from '@heroku/heroku-fetch'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/redis/info.js'

const heredoc = tsheredoc.default

const notFound = () => new NotFoundError(new Response('', {status: 404}))

describe('heroku redis:info', function () {
  afterEach(function () {
    restore()
  })

  it('# prints out nothing when there is no redis DB', async function () {
    const listByApp = stub().resolves([])
    const info = stub()
    stub(HerokuSDK.prototype, 'platform').get(() => ({addOn: {listByApp}}))
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {info}}))

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])

    expect(info.called).to.equal(false)
    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
  })

  it('# prints out redis info', async function () {
    const addon = {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'}
    const listByApp = stub().resolves([addon])
    const info = stub().resolves({info: [{name: 'Foo', values: ['Bar', 'Biz']}]})
    stub(HerokuSDK.prototype, 'platform').get(() => ({addOn: {listByApp}}))
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {info}}))

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])

    expect(info.calledOnceWithExactly('redis-haiku')).to.equal(true)
    expectOutput(stderr, '')
    expectOutput(stdout, heredoc(`
      === redis-haiku (REDIS_FOO, REDIS_BAR)
      Foo: Bar
           Biz
    `))
  })

  it('# prints out JSON-formatted redis info', async function () {
    const addon = {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'}
    const listByApp = stub().resolves([addon])
    const info = stub().resolves({info: [{name: 'Foo', values: ['Bar', 'Biz']}]})
    stub(HerokuSDK.prototype, 'platform').get(() => ({addOn: {listByApp}}))
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {info}}))

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example', '--json'])

    expectOutput(stderr, '')
    expectOutput(stdout, heredoc(`
      [
        {
          "info": [
            {
              "name": "Foo",
              "values": [
                "Bar",
                "Biz"
              ]
            }
          ],
          "config_vars": [
            "REDIS_FOO",
            "REDIS_BAR"
          ]
        }
      ]
    `))
  })

  it('# prints nothing when redis is not found', async function () {
    const addon = {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'}
    const listByApp = stub().resolves([addon])
    const info = stub().rejects(notFound())
    stub(HerokuSDK.prototype, 'platform').get(() => ({addOn: {listByApp}}))
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {info}}))

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])

    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
  })

  it('# raises an appropriate error when API call fails', async function () {
    const addon = {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'}
    const listByApp = stub().resolves([addon])
    const info = stub().rejects(new Error('HTTP Error 503 for redis-haiku'))
    stub(HerokuSDK.prototype, 'platform').get(() => ({addOn: {listByApp}}))
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {info}}))

    const {error} = await runCommand(Cmd, ['--app', 'example'])
    expect(error?.message).to.include('HTTP Error 503')
    expect(error?.message).to.include('redis-haiku')
  })
})
