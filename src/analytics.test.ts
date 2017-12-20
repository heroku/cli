import { buildConfig } from 'cli-engine-config'
import * as nock from 'nock'
import AnalyticsCommand from './analytics'
import { Command } from 'cli-engine-command'

class TestCommand extends Command {
  static topic = 'fuzz'
  static command = 'fizz'
}

class TestCommandWithPlugin extends Command {
  static topic = 'fuzz'
  static command = 'fizz'
  static plugin = { type: 'user', name: 'fuzz', version: '9.8.7', root: '.' }
}

let api = nock('https://cli-analytics.heroku.com')

beforeEach(() => {
  api = nock('https://cli-analytics.heroku.com')
})

afterEach(() => {
  api.done()
})

function analyticsJson() {
  return {
    schema: 1,
    cli: 'cli-engine',
    user: 'foobar@heroku.com',
    commands: [
      {
        command: 'foo',
        completion: 0,
        version: '1.2.3',
        plugin: 'fuzz',
        plugin_version: '4.5.6',
        os: 'darwin',
        shell: 'fish',
        language: 'node',
        valid: true,
      },
    ],
  }
}

function build(configOptions = {}, options: any = {}) {
  let config = buildConfig({
    version: '1.2.3',
    platform: 'windows',
    name: 'cli-engine',
    ...configOptions,
  })

  let json = options.json || analyticsJson()

  let command = new AnalyticsCommand(config)

  // @ts-ignore
  command._existsJSON = function() {
    return true
  }

  command._readJSON = function() {
    return json
  }

  // @ts-ignore
  command._writeJSON = jest.fn()

  // @ts-ignore
  command._acAnalytics = function() {
    return 7
  }

  // @ts-ignore
  Object.defineProperty(command, 'netrcLogin', {
    get: function() {
      if (options.hasOwnProperty('netrcLogin')) {
        // flow$ignore
        return options['netrcLogin']
      }

      return 'foobar@heroku.com'
    },
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
    delete process.env['HEROKU_ANALYTICS_URL']
  })

  describe('submit', () => {
    it.skip('does not submit if config skipAnalytics is true', async () => {
      let api = nock('https://cli-analytics.heroku.com')
        .post('/record')
        .reply(200, {})

      let command = build({ skipAnalytics: true })

      await command.submit()
      expect(api.isDone()).toBe(false)
    })

    it('does not submit if HEROKU_API_KEY is set', async () => {
      process.env['HEROKU_API_KEY'] = 'secure-key'

      let api = nock('https://cli-analytics.heroku.com')
        .post('/record')
        .reply(200, {})

      await build().submit()
      expect(api.isDone()).toBe(false)
    })

    it('does not submit if login is not set', async () => {
      let api = nock('https://cli-analytics.heroku.com')
        .post('/record')
        .reply(200, {})

      let command = build({}, { netrcLogin: null })

      await command.submit()
      expect(api.isDone()).toBe(false)
    })

    it('does not submit if commands is empty', async () => {
      let api = nock('https://cli-analytics.heroku.com')
        .post('/record')
        .reply(200, {})

      let json = analyticsJson()
      json.commands = []
      let command = build({}, { json })

      await command.submit()
      expect(api.isDone()).toBe(false)
    })

    it.skip('pushes data to the record endpoint', async () => {
      let json = analyticsJson()
      api.post('/record', json).reply(200, {})

      let command = build({}, { json })

      await command.submit()
    })

    it.skip('clears the local commands after success', async () => {
      let json = analyticsJson()
      api.post('/record', json).reply(200, {})

      let command = build({}, { json })

      await command.submit()

      let expected = Object.assign({}, json, { commands: [] })
      // @ts-ignore
      expect(command._writeJSON.mock.calls).toEqual([[expected]])
    })

    it.skip('pushes data to the HEROKU_ANALYTICS_URL endpoint', async () => {
      process.env['HEROKU_ANALYTICS_URL'] = 'https://foobar.com/record'
      let json = analyticsJson()
      let api = nock('https://foobar.com')
        .post('/record', json)
        .reply(200, {})

      let command = build({}, { json })

      await command.submit()
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
        argv: [],
      })

      // @ts-ignore
      expect(command._writeJSON.mock.calls).toEqual([])
    })

    it('does not record if config skipAnalytics is true', async () => {
      let command = build({ skipAnalytics: true })

      await command.record({
        Command: TestCommand,
        argv: [],
      })

      // @ts-ignore
      expect(command._writeJSON.mock.calls).toEqual([])
    })

    it('does not record if HEROKU_API_KEY is set', async () => {
      process.env['HEROKU_API_KEY'] = 'secure-key'

      let command = build()

      await command.record({
        Command: TestCommand,
        argv: [],
      })

      // @ts-ignore
      expect(command._writeJSON.mock.calls).toEqual([])
    })

    it('does not record if login is not set', async () => {
      let command = build({}, { netrcLogin: null })

      await command.record({
        Command: TestCommand,
        argv: [],
      })

      // @ts-ignore
      expect(command._writeJSON.mock.calls).toEqual([])
    })

    it('records commands', async () => {
      let json = analyticsJson()
      let expected = analyticsJson()
      expected.commands.push({
        command: 'fuzz:fizz',
        completion: 7,
        os: 'windows',
        shell: 'cmd.exe',
        plugin: 'fuzz',
        plugin_version: '9.8.7',
        valid: true,
        version: '1.2.3',
        language: 'node',
      })

      let command = build({}, { json })
      await command.record({
        Command: TestCommandWithPlugin,
        argv: [],
      })
      // @ts-ignore
      expect(command._writeJSON.mock.calls).toEqual([[expected]])
    })
  })
})
