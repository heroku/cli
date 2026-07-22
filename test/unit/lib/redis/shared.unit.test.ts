import {type GenericCmd, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {RedisAddonAmbiguousError, RedisAddonNotFoundError} from '@heroku/sdk/resources/data/redis'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

/* eslint-disable mocha/no-exports */
export function shouldHandleArgs(command: GenericCmd, flags: Record<string, unknown> = {}) {
  describe('a CLI redis command', function () {
    afterEach(function () {
      restore()
    })

    it('shows an error if an app has no addons', async function () {
      const resolveByApp = stub().rejects(new RedisAddonNotFoundError())
      stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp}}))

      const {error, stdout} = await runCommand(command, [
        '--app',
        'example',
      ].concat(Object.entries(flags).map(([k, v]) => `--${k}=${v}`)))

      expect(error?.message).to.contain('No Redis instances found.')
      expect(error).to.be.instanceOf(RedisAddonNotFoundError)
      expect(stdout).to.eq('')
    })

    it('shows an error if the addon is ambiguous', async function () {
      const matches = [
        {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO'], name: 'redis-haiku-a'},
        {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_BAR'], name: 'redis-haiku-b'},
      ]
      const resolveByApp = stub().rejects(new RedisAddonAmbiguousError(matches as never))
      stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp}}))

      const {error, stdout} = await runCommand(command, [
        '--app',
        'example',
      ].concat(Object.entries(flags).map(([k, v]) => `--${k}=${v}`)))

      expect(error?.message).to.contain('Please specify a single instance. Found: redis-haiku-a, redis-haiku-b')
      expect(error).to.be.instanceOf(RedisAddonAmbiguousError)
      expect(stdout).to.eq('')
    })
  })
}
