import {buildConfig} from 'cli-engine-config'
import * as nock from 'nock'
import {Analytics} from './analytics'
import {Command} from 'cli-engine-command'

class TestCommand extends Command {
  __config = {
    id: 'fuzz:fizz',
    plugin: {
      name: 'fuzz',
      version: '9.8.7',
    },
    _version: '1.0.0',
  }
}

function analyticsJson () {
  return {
    schema: 1,
    install: '5a8ef179-1129-4f81-877c-662c89f83f1f',
    cli: 'heroku',
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

function build (configOptions: any = {}, options: any = {}) {
  let config = {
    ...buildConfig({
      platform: 'windows',
    }),
    install: '5a8ef179-1129-4f81-877c-662c89f83f1f',
    version: '1.2.3',
    skipAnalytics: false,
    name: 'heroku',
    ...configOptions
  }

  let json = options.json || analyticsJson()

  let command = new Analytics(config)

  ;(<any>command)._existsJSON = function () {
    return true
  }

  command._readJSON = function () {
    return json
  }

  command._writeJSON = jest.fn()

  ;(<any>command)._acAnalytics = function () {
    return 7
  }

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
      expect((<any>command._writeJSON).mock.calls).toEqual([[expected]])

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

      expect((<any>command._writeJSON).mock.calls).toEqual([[expected]])

      api.done()
    })
  })

  // describe('record', () => {
  //   const SHELL = process.env.SHELL
  //
  //   beforeAll(() => {
  //     delete process.env.SHELL
  //     process.env['COMSPEC'] = 'C:\\ProgramFiles\\cmd.exe'
  //   })
  //
  //   afterAll(() => {
  //     delete process.env.COMSPEC
  //     process.env['SHELL'] = SHELL
  //   })
  //
  //   it('does not record if no plugin', async () => {
  //     let analytics = build()
  //     let command = new TestCommand()
  //     delete command.__config.plugin
  //
  //     await analytics.record({
  //       command,
  //       argv: []
  //     })
  //
  //     expect((<any>analytics._writeJSON).mock.calls).toEqual([])
  //   })
  //
  //   it('does not record if config skipAnalytics is true', async () => {
  //     let analytics = build({skipAnalytics: true})
  //     let command = new TestCommand()
  //
  //     await analytics.record({
  //       command,
  //       argv: []
  //     })
  //
  //     expect((<any>analytics._writeJSON).mock.calls).toEqual([])
  //   })
  //
  //   it('does not record if HEROKU_API_KEY is set', async () => {
  //     process.env['HEROKU_API_KEY'] = 'secure-key'
  //
  //     let analytics = build()
  //     let command = new TestCommand()
  //
  //     await analytics.record({
  //       command,
  //       argv: []
  //     })
  //
  //     expect((<any>analytics._writeJSON).mock.calls).toEqual([])
  //   })
  //
  //   it('does not record if login is not set', async () => {
  //     let analytics = build({}, {netrcLogin: null})
  //     let command = new TestCommand()
  //
  //     await analytics.record({
  //       command,
  //       argv: []
  //     })
  //
  //     expect((<any>analytics._writeJSON).mock.calls).toEqual([])
  //   })
  //
  //   it('records commands', async () => {
  //     let json = analyticsJson()
  //     let expected = analyticsJson()
  //     expected.commands.push({
  //       'command': 'fuzz:fizz',
  //       'completion': 7,
  //       'os': 'windows',
  //       'shell': 'cmd.exe',
  //       'plugin': 'fuzz',
  //       'plugin_version': '9.8.7',
  //       'valid': true,
  //       'version': '1.2.3',
  //       'language': 'node'
  //     } as any)
  //
  //     let command = new TestCommand()
  //     let analytics = build({}, {json})
  //     await analytics.record({
  //       command,
  //       argv: []
  //     })
  //     expect((<any>analytics._writeJSON).mock.calls).toEqual([[expected]])
  //   })
  // })
})
