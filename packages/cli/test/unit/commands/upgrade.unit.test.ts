import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../src/commands/redis/upgrade'
import runCommand from '../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import expectOutput from '../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import stripAnsi = require('strip-ansi')

describe('heroku redis:upgrade', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('# upgrades the redis version', async () => {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_URL']},
      ])
    nock('https://api.data.heroku.com:443')
      .post('/redis/v0/databases/redis-haiku/upgrade', {version: '6.2'})
      .reply(200, {
        message: 'Upgrading version now!',
      })
    await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
      '--version',
      '6.2',
    ])
    expectOutput(stderr.output, heredoc(`
      Requesting upgrade of redis-haiku to 6.2...
      Requesting upgrade of redis-haiku to 6.2... Upgrading version now!
    `))
  })

  it('# errors on missing version', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
    ])
      .catch((error: Error) => {
        expect(stdout.output).to.equal('')
        expect(stripAnsi(error.message)).to.equal(heredoc(`
          The following error occurred:
            Missing required flag version
          See more help with --help`))
      })
  })
})
