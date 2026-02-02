import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'

import runCommand, {GenericCmd} from '../../../helpers/runCommand.js'

/* eslint-disable mocha/no-exports */
export function shouldHandleArgs(command: GenericCmd, flags: Record<string, unknown> = {}) {
  describe('a CLI redis command', function () {
    afterEach(function () {
      nock.cleanAll()
    })

    it('shows an error if an app has no addons', async function () {
      const api = nock('https://api.heroku.com')
        .get('/apps/example/addons').reply(200, [])

      try {
        await runCommand(command, [
          '--app',
          'example',
        ].concat(Object.entries(flags).map(([k, v]) => `--${k}=${v}`)))
      } catch (error: unknown) {
        const {message, oclif} = error as Errors.CLIError
        expect(message).to.contain('No Redis instances found.')
        expect(oclif.exit).to.equal(1)
      }

      api.done()
      expect(stdout.output).to.eq('')
    })

    it('shows an error if the addon is ambiguous', async function () {
      const api = nock('https://api.heroku.com')
        .get('/apps/example/addons').reply(200, [
          {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO'], name: 'redis-haiku-a'},
          {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_BAR'], name: 'redis-haiku-b'},
        ])

      try {
        await runCommand(command, [
          '--app',
          'example',
        ].concat(Object.entries(flags).map(([k, v]) => `--${k}=${v}`)))
      } catch (error: unknown) {
        const {message, oclif} = error as Errors.CLIError
        expect(message).to.contain('Please specify a single instance. Found: redis-haiku-a, redis-haiku-b')
        expect(oclif.exit).to.equal(1)
      }

      api.done()
      expect(stdout.output).to.eq('')
    })
  })
}
