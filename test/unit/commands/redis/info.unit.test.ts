import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/redis/info.js'
import {runCommand} from '../../../helpers/run-command.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

describe('heroku redis:info', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  it('# prints out nothing when there is no redis DB', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [])
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
  })

  it('# prints out redis info', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'},
      ])
    nock('https://api.data.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku')
      .reply(200, {info: [{name: 'Foo', values: ['Bar', 'Biz']}]})
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expectOutput(stderr, '')
    expectOutput(stdout, heredoc(`
      === redis-haiku (REDIS_FOO, REDIS_BAR)
      Foo: Bar
           Biz
    `))
  })

  it('# prints out JSON-formatted redis info', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'},
      ])
    nock('https://api.data.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku')
      .reply(200, {info: [{name: 'Foo', values: ['Bar', 'Biz']}]})
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--json',
    ])
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
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'},
      ])
    nock('https://api.data.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku')
      .reply(404)
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
  })

  it('# raises an appropriate error when API call fails', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR'], name: 'redis-haiku'},
      ])
    nock('https://api.data.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku')
      .reply(503, {})
    await runCommand(Cmd, [
      '--app',
      'example',
    ]).catch(function (error: Error) {
      expect(error.message).to.include('HTTP Error 503')
      expect(error.message).to.include('redis-haiku')
    })
  })
})
