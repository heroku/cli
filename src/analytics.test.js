// @flow

import {buildConfig} from 'cli-engine-config'
import nock from 'nock'
import AnalyticsCommand from './analytics'
import {Command} from 'cli-engine-command'

class TestCommand extends Command<*> {
  static topic = 'fuzz'
  static command = 'fizz'
}

class TestCommandWithPlugin extends Command<*> {
  static topic = 'fuzz'
  static command = 'fizz'
  static plugin = {name: 'fuzz', version: '9.8.7'}
}

function analyticsJson () {
  return {
    schema: 1,
    install: '5a8ef179-1129-4f81-877c-662c89f83f1f',
    cli: 'cli-engine',
    user: 'foobar@heroku.com',
    commands: [
      {
        command: 'foo',
        completion: 0,
        version: '1.2.3',
        plugin_version: '4.5.6',
        os: 'darwin',
        shell: 'fish',
        valid: true
      }
    ]
  }
}

function build (configOptions = {}, options = {}) {
  let config = buildConfig({
    version: '1.2.3',
    platform: 'windows',
    skipAnalytics: false,
    install: '5a8ef179-1129-4f81-877c-662c89f83f1f',
    name: 'cli-engine',
    ...configOptions
  })

  let json = options.json || analyticsJson()

  let command = new AnalyticsCommand(config)

  // flow$ignore
  command._existsJSON = function () {
    return true
  }

  // flow$ignore
  command._readJSON = function () {
    return json
  }

  // flow$ignore
  command._writeJSON = jest.fn()

  // flow$ignore
  command._acAnalytics = function () {
    return 7
  }

  // flow$ignore
  Object.defineProperty(command, 'netrcLogin', {
    get: function () {
      if (options.hasOwnProperty('netrcLogin')) {
        // flow$ignore
        return options['netrcLogin']
      }

      return 'foobar@heroku.com'
    }
  })

  return command
}

describe('AnalyticsCommand', () => {
  beforeAll(() => {
    nock.disableNetConnect()
  })

  beforeEach(() => {
    nock.cleanAll()
    delete process.env['HEROKU_API_KEY']
    delete process.env['CLI_ENGINE_ANALYTICS_URL']
  })

  describe('submit', () => {
    it('does not submit if config skipAnalytics is true', async () => {
      let api = nock('https://cli-analytics.heroku.com').post('/record').reply(200, {})

      let command = build({skipAnalytics: true})

      await command.submit()
      expect(api.isDone()).toBe(false)
    })

    it('does not submit if HEROKU_API_KEY is set', async () => {
      process.env['HEROKU_API_KEY'] = 'secure-key'

      let api = nock('https://cli-analytics.heroku.com').post('/record').reply(200, {})

      await build().submit()
      expect(api.isDone()).toBe(false)
    })

    it('does not submit if login is not set', async () => {
      let api = nock('https://cli-analytics.heroku.com').post('/record').reply(200, {})

      let command = build({}, {netrcLogin: null})

      await command.submit()
      expect(api.isDone()).toBe(false)
    })

    it('does not submit if commands is empty', async () => {
      let api = nock('https://cli-analytics.heroku.com').post('/record').reply(200, {})

      let json = analyticsJson()
      json.commands = []
      let command = build({}, {json})

      await command.submit()
      expect(api.isDone()).toBe(false)
    })

    it('pushes data to the record endpoint', async () => {
      let json = analyticsJson()
      let api = nock('https://cli-analytics.heroku.com').post('/record', json).reply(200, {})

      let command = build({}, {json})

      await command.submit()
      api.done()
    })

    it('clears the local commands after success', async () => {
      let json = analyticsJson()
      let api = nock('https://cli-analytics.heroku.com').post('/record', json).reply(200, {})

      let command = build({}, {json})

      await command.submit()

      let expected = Object.assign({}, json, {commands: []})
      expect(command._writeJSON.mock.calls).toEqual([[expected]])

      api.done()
    })

    it('pushes data to the CLI_ENGINE_ANALYTICS_URL endpoint', async () => {
      process.env['CLI_ENGINE_ANALYTICS_URL'] = 'https://foobar.com/record'
      let json = analyticsJson()
      let api = nock('https://foobar.com').post('/record', json).reply(200, {})

      let command = build({}, {json})

      await command.submit()
      api.done()
    })

    it('traps errors sending to the endpoint', async () => {
      let json = analyticsJson()
      let api = nock('https://cli-analytics.heroku.com').post('/record', json).reply(503, {})

      let command = build({}, {json})

      await command.submit()

      let expected = {
        schema: 1,
        commands: []
      }

      expect(command._writeJSON.mock.calls).toEqual([[expected]])

      api.done()
    })
  })

  describe('record', () => {
    const SHELL = process.env.SHELL

    beforeAll(() => {
      delete process.env.SHELL
      process.env['COMSPEC'] = 'C:\\ProgramFiles\\cmd.exe'
    })

    afterAll(() => {
      delete process.env.COMSPEC
      process.env['SHELL'] = SHELL
    })

    it('does not record if no plugin', async () => {
      let command = build()

      await command.record({
        Command: TestCommand,
        argv: []
      })

      expect(command._writeJSON.mock.calls).toEqual([])
    })

    it('does not record if config skipAnalytics is true', async () => {
      let command = build({skipAnalytics: true})

      await command.record({
        Command: TestCommand,
        argv: []
      })

      expect(command._writeJSON.mock.calls).toEqual([])
    })

    it('does not record if HEROKU_API_KEY is set', async () => {
      process.env['HEROKU_API_KEY'] = 'secure-key'

      let command = build()

      await command.record({
        Command: TestCommand,
        argv: []
      })

      expect(command._writeJSON.mock.calls).toEqual([])
    })

    it('does not record if login is not set', async () => {
      let command = build({}, {netrcLogin: null})

      await command.record({
        Command: TestCommand,
        argv: []
      })

      expect(command._writeJSON.mock.calls).toEqual([])
    })

    it('records commands', async () => {
      let json = analyticsJson()
      let expected = analyticsJson()
      expected.commands.push({
        'command': 'fuzz:fizz',
        'completion': 7,
        'os': 'windows',
        'shell': 'cmd.exe',
        'plugin': 'fuzz',
        'plugin_version': '9.8.7',
        'valid': true,
        'version': '1.2.3',
        'language': 'node'
      })

      let command = build({}, {json})
      await command.record({
        Command: TestCommandWithPlugin,
        argv: []
      })
      expect(command._writeJSON.mock.calls).toEqual([[expected]])
    })
  })
})
