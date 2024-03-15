import * as nock from 'nock'
import {expect} from 'chai'
import runCommand, {GenericCmd} from '../../../helpers/runCommand'
import expectOutput from '../../../helpers/utils/expectOutput'
import {stdout} from 'stdout-stderr'

export function shouldHandleArgs(command: GenericCmd, flags: {[key: string]: string} = {}) {
  flags = flags || {}

  describe('', function () {
    beforeEach(function () {
      nock.cleanAll()
    })

    it('# shows an error if an app has no addons', async function () {
      nock('https://api.heroku.com:443')
        .get('/apps/example/addons').reply(200, [])
      await runCommand(command, ['--app', 'example', ...Object.keys(flags).map(k => `--${k}=${flags[k]}`)])
        .catch(function (error: Error) {
          expect(error.message).to.equal('No Redis instances found.')
        })
      expectOutput(stdout.output, '')
    })

    it('# shows an error if the addon is ambiguous', async function () {
      nock('https://api.heroku.com:443')
        .get('/apps/example/addons').reply(200, [
          {name: 'redis-haiku-a', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO']},
          {name: 'redis-haiku-b', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_BAR']},
        ])
      await runCommand(command, ['--app', 'example', ...Object.keys(flags).map(k => `--${k}=${flags[k]}`)])
        .catch(function (error: Error) {
          expect(error.message).to.equal('Please specify a single instance. Found: redis-haiku-a, redis-haiku-b')
        })
      expectOutput(stdout.output, '')
    })
  })
}
