import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'

import {type GenericCmd, runCommand} from '../../../helpers/run-command.js'

/* eslint-disable mocha/no-exports */
export function shouldHandleArgs(command: GenericCmd, flags: Record<string, unknown> = {}) {
  describe('a CLI redis command', function () {
    afterEach(function () {
      nock.cleanAll()
    })

    it('shows an error if an app has no addons', async function () {
      const api = nock('https://api.heroku.com')
        .get('/apps/example/addons').reply(200, [])

      const {error, stdout} = await runCommand(command, [
        '--app',
        'example',
      ].concat(Object.entries(flags).map(([k, v]) => `--${k}=${v}`)))

      expect(error?.message).to.contain('No Redis instances found.')
      expect((error as any)?.oclif?.exit).to.equal(1)

      api.done()
      expect(stdout).to.eq('')
    })

    it('shows an error if the addon is ambiguous', async function () {
      const api = nock('https://api.heroku.com')
        .get('/apps/example/addons').reply(200, [
          {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO'], name: 'redis-haiku-a'},
          {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_BAR'], name: 'redis-haiku-b'},
        ])

      const {error, stdout} = await runCommand(command, [
        '--app',
        'example',
      ].concat(Object.entries(flags).map(([k, v]) => `--${k}=${v}`)))

      expect(error?.message).to.contain('Please specify a single instance. Found: redis-haiku-a, redis-haiku-b')
      expect((error as any)?.oclif?.exit).to.equal(1)

      api.done()
      expect(stdout).to.eq('')
    })
  })
}
