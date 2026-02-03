import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/redis/promote.js'
import runCommand from '../../../helpers/runCommand.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

describe('heroku redis:promote should handle standard arg behavior', function () {
  shouldHandleArgs(Cmd)
})

describe('heroku redis:promote', function () {
  beforeEach(async function () {
    return nock.cleanAll()
  })

  it('# promotes', async function () {
    const app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_URL', 'HEROKU_REDIS_SILVER_URL'],
          name: 'redis-silver-haiku',
        }, {
          addon_service: {name: 'heroku-redis'},
          config_vars: ['HEROKU_REDIS_GOLD_URL'],
          name: 'redis-gold-haiku',
        },
      ])

    const attach = nock('https://api.heroku.com:443')
      .post('/addon-attachments', {
        addon: {name: 'redis-gold-haiku'},
        app: {name: 'example'},
        confirm: 'example',
        name: 'REDIS',
      })
      .reply(200, {})

    await runCommand(Cmd, [
      '--app',
      'example',
      'redis-gold-haiku',
    ])
    app.done()
    attach.done()
    expect(stdout.output).to.equal('Promoting redis-gold-haiku to REDIS_URL on example\n')
    expect(stderr.output).to.equal('')
  })

  it('# promotes and replaces attachment of existing REDIS_URL if necessary', async function () {
    const app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {
          addon_service: {name: 'heroku-redis'},
          config_vars: [
            'REDIS_URL',
            'REDIS_BASTIONS',
            'REDIS_BASTION_KEY',
            'REDIS_BASTION_REKEYS_AFTER',
          ],
          name: 'redis-silver-haiku',
        }, {
          addon_service: {name: 'heroku-redis'},
          config_vars: ['HEROKU_REDIS_GOLD_URL'],
          name: 'redis-gold-haiku',
        },
      ])
    const attachRedisUrl = nock('https://api.heroku.com:443')
      .post('/addon-attachments', {
        addon: {name: 'redis-silver-haiku'},
        app: {name: 'example'},
        confirm: 'example',
      })
      .reply(200, {})
    const attach = nock('https://api.heroku.com:443')
      .post('/addon-attachments', {
        addon: {name: 'redis-gold-haiku'},
        app: {name: 'example'},
        confirm: 'example',
        name: 'REDIS',
      })
      .reply(200, {})
    await runCommand(Cmd, [
      '--app',
      'example',
      'redis-gold-haiku',
    ])
    app.done()
    attachRedisUrl.done()
    attach.done()
    expect(stdout.output).to.equal('Promoting redis-gold-haiku to REDIS_URL on example\n')
    expect(stderr.output).to.equal('')
  })
})
