import {CLIError} from '@oclif/core/lib/errors'
import {stdout, stderr} from 'stdout-stderr'

import * as nock from 'nock'
import {expect} from 'chai'
import runCommand, {type GenericCmd} from '../../../helpers/runCommand'
import {unwrap} from '../../../helpers/utils/unwrap'

exports.shouldHandleArgs = function (command: GenericCmd) {
  describe('', function () {
    beforeEach(function () {
      nock.cleanAll()
    })

    it('# shows an error if an app has no addons', async () => {
      const app = nock('https://api.heroku.com:443')
        .get('/apps/example/addons')
        .reply(200, [])

      try {
        await runCommand(command, [
          '--app',
          'example',
        ])
      } catch (error) {
        expect(error).to.be.an.instanceof(CLIError)
      }

      app.done()
      expect(stdout.output).to.equal('')
      expect(unwrap(stderr.output)).to.equal('No Redis instances found.\n')
    })

    it('# shows an error if the addon is ambiguous', async () => {
      const app = nock('https://api.heroku.com:443')
        .get('/apps/example/addons')
        .reply(200, [
          {
            name: 'redis-haiku-a',
            addon_service: {name: 'heroku-redis'},
            config_vars: ['REDIS_FOO'],
          }, {name: 'redis-haiku-b', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_BAR']},
        ])

      try {
        await runCommand(command, [
          '--app',
          'example',
        ])
      } catch (error) {
        expect(error).to.be.an.instanceof(CLIError)
      }

      app.done()
      expect(stdout.output).to.equal('')
      expect(unwrap(stderr.output)).to.equal('Please specify a single instance. Found: redis-haiku-a, redis-haiku-b\n')
    })
  })
}
