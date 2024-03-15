import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/redis/maxmemory'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import stripAnsi = require('strip-ansi')
import {shouldHandleArgs} from '../../lib/redis/shared'

describe('heroku redis:maxmemory', function () {
  shouldHandleArgs(Cmd, {policy: 'noeviction'})
})

describe('heroku redis:maxmemory', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  it('# sets the key eviction policy', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])
    nock('https://api.data.heroku.com:443')
      .patch('/redis/v0/databases/redis-haiku/config', {maxmemory_policy: 'noeviction'})
      .reply(200, {
        maxmemory_policy: {value: 'noeviction', values: {noeviction: 'return errors when memory limit is reached'}},
      })
    await runCommand(Cmd, [
      '--app',
      'example',
      '--policy',
      'noeviction',
    ])
    expectOutput(stderr.output, '')
    expectOutput(stdout.output, heredoc(`
      Maxmemory policy for redis-haiku (REDIS_FOO, REDIS_BAR) set to noeviction.
      noeviction return errors when memory limit is reached.
    `))
  })
  it('# errors on missing eviction policy', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
    ]).catch(function (error: Error) {
      expect(stripAnsi(error.message)).to.equal(heredoc(`
        The following error occurred:
          Missing required flag policy
        See more help with --help`))
    })
  })
})
