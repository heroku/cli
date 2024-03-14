import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/redis/info'
import * as nock from 'nock'
import {expect} from 'chai'
import expectOutput from '../../../helpers/utils/expectOutput'
import runCommand from '../../../helpers/runCommand'
import heredoc from 'tsheredoc'

describe('heroku redis:info', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  it('# prints out nothing when there is no redis DB', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [])
    await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
  })

  it('# prints out redis info', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])
    nock('https://api.data.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku')
      .reply(200, {info: [{name: 'Foo', values: ['Bar', 'Biz']}]})
    await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expectOutput(stderr.output, '')
    expectOutput(stdout.output, heredoc(`
      === redis-haiku (REDIS_FOO, REDIS_BAR)
      Foo: Bar
           Biz
    `))
  })

  it('# prints out JSON-formatted redis info', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])
    nock('https://api.data.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku')
      .reply(200, {info: [{name: 'Foo', values: ['Bar', 'Biz']}]})
    await runCommand(Cmd, [
      '--app',
      'example',
      '--json',
    ])
    expectOutput(stderr.output, '')
    expectOutput(stdout.output, heredoc(`
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
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])
    nock('https://api.data.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku')
      .reply(404)
    await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
  })

  it('# raises an appropriate error when API call fails', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/example/addons')
      .reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']},
      ])
    nock('https://api.data.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku')
      .reply(503, {})
    await runCommand(Cmd, [
      '--app',
      'example',
    ]).catch(function (error: Error) {
      expect(error.message).to.equal('HTTP Error 503 for get https://api.heroku.com/redis/v0/databases/redis-haiku\n{}')
    })
  })
})
