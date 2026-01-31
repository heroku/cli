import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/redis/maintenance.js'
import runCommand from '../../../helpers/runCommand.js'
import {shouldHandleArgs} from '../../lib/redis/shared.unit.test.js'

describe('heroku redis:maintenance should handle standard arg behavior', function () {
  shouldHandleArgs(Cmd)
})

describe('heroku redis:maintenance', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('# shows the maintenance message', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons').reply(200, [
        {
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          name: 'redis-haiku',
          plan: {name: 'premium-0'},
        },
      ])

    const redis = nock('https://api.data.heroku.com')
      .get('/redis/v0/databases/redis-haiku/maintenance').reply(200, {message: 'Message'})

    await runCommand(Cmd, [
      '--app',
      'example',
    ])

    api.done()
    redis.done()

    expect(stdout.output).to.equal('Message\n')
    expect(stderr.output).to.equal('')
  })

  it('# sets the maintenance window', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons').reply(200, [
        {
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          name: 'redis-haiku',
          plan: {name: 'premium-0'},
        },
      ])

    const redis = nock('https://api.data.heroku.com')
      .put('/redis/v0/databases/redis-haiku/maintenance_window', {
        description: 'Mon 10:00',
      }).reply(200, {window: 'Mon 10:00'})

    await runCommand(Cmd, [
      '--app',
      'example',
      '--window',
      'Mon 10:00',
    ])

    api.done()
    redis.done()

    expect(stdout.output).to.equal('Maintenance window for redis-haiku (REDIS_FOO, REDIS_BAR) set to Mon 10:00.\n')
    expect(stderr.output).to.equal('')
  })

  it('# runs the maintenance', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons').reply(200, [
        {
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          name: 'redis-haiku',
          plan: {name: 'premium-0'},
        },
      ])
      .get('/apps/example').reply(200, {maintenance: true})

    const redis = nock('https://api.data.heroku.com')
      .post('/redis/v0/databases/redis-haiku/maintenance').reply(200, {message: 'Message'})

    await runCommand(Cmd, [
      '--app',
      'example',
      '--run',
    ])

    api.done()
    redis.done()

    expect(stdout.output).to.equal('Message\n')
    expect(stderr.output).to.equal('')
  })

  it('# run errors out when not in maintenance', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons').reply(200, [
        {
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          name: 'redis-haiku',
          plan: {name: 'premium-0'},
        },
      ])
      .get('/apps/example').reply(200, {maintenance: false})

    try {
      await runCommand(Cmd, [
        '--app',
        'example',
        '--run',
      ])
    } catch (error: unknown) {
      const {message, oclif} = error as Errors.CLIError
      expect(message).to.equal('Application must be in maintenance mode or --force flag must be used')
      expect(oclif.exit).to.equal(1)
    }

    api.done()
    expect(stdout.output).to.equal('')
  })

  it('# errors out on hobby dynos', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons').reply(200, [
        {
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          name: 'redis-haiku',
          plan: {name: 'hobby'},
        },
      ])

    try {
      await runCommand(Cmd, [
        '--app',
        'example',
      ])
    } catch (error: unknown) {
      const {message, oclif} = error as Errors.CLIError
      expect(message).to.equal('redis:maintenance is not available for hobby-dev instances')
      expect(oclif.exit).to.equal(1)
    }

    api.done()
    expect(stdout.output).to.equal('')
  })

  it('# errors out on bad maintenance window', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/addons').reply(200, [
        {
          addon_service: {name: 'heroku-redis'},
          config_vars: ['REDIS_FOO', 'REDIS_BAR'],
          name: 'redis-haiku',
          plan: {name: 'premium-0'},
        },
      ])

    try {
      await runCommand(Cmd, [
        '--app',
        'example',
        '--window',
        'Mon 10:45',
      ])
    } catch (error: unknown) {
      const {message, oclif} = error as Errors.CLIError
      expect(message).to.equal('Maintenance windows must be "Day HH:MM", where MM is 00 or 30.')
      expect(oclif.exit).to.equal(1)
    }

    api.done()
    expect(stdout.output).to.equal('')
  })
})
