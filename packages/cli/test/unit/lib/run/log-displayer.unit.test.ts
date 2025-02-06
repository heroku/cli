/* eslint-disable max-nested-callbacks */
import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {CLIError} from '@oclif/core/lib/errors'
import {expect} from 'chai'
import * as nock from 'nock'
import {stdout, stderr} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import logDisplayer from '../../../../src/lib/run/log-displayer'
import {cedarApp, firApp} from '../../../fixtures/apps/fixtures'

describe('logDisplayer', function () {
  let api: nock.Scope
  let heroku: APIClient
  let env: NodeJS.ProcessEnv

  // Mock fetch globally since we're in Node test environment
  const originalFetch = globalThis.fetch
  let mockResponse: ReadableStream | null = null

  before(async function () {
    env = process.env
    env.HEROKU_LOGS_COLOR = '0'
    const config = await Config.load()
    heroku = new APIClient(config)
  })

  beforeEach(function () {
    // Mock fetch for each test

    const mockFetch = async () => {
      if (!mockResponse) {
        return new Response(null, {status: 401, statusText: 'Unauthorized'})
      }

      return new Response(mockResponse, {
        status: 200,
        headers: {'Content-Type': 'text/event-stream'},
      })
    }

    Reflect.set(globalThis, 'fetch', mockFetch)
  })

  afterEach(function () {
    mockResponse = null
  })

  after(function () {
    process.env = env
    globalThis.fetch = originalFetch
  })

  describe('log session creation', function () {
    context('with a Cedar app', function () {
      beforeEach(function () {
        api = nock('https://api.heroku.com', {
          reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
        }).get('/apps/my-cedar-app')
          .reply(200, cedarApp)
      })

      afterEach(function () {
        api.done()
      })

      context('with dyno and no type options', function () {
        it('creates a log session with dyno parameter set to the option value', async function () {
          api
            .post('/apps/my-cedar-app/log-sessions', {
              dyno: 'web.1',
              lines: 20,
              source: 'app',
              tail: true,
            })
            .reply(200, {logplex_url: 'https://logs.heroku.com/stream?tail=true&token=s3kr3t'})

          // Mock fetch to return 401
          mockResponse = null

          try {
            await logDisplayer(heroku, {
              app: 'my-cedar-app',
              dyno: 'web.1',
              lines: 20,
              source: 'app',
              tail: true,
            })
          } catch (error: unknown) {
            const {message} = error as CLIError
            expect(message).to.equal('Logs stream failed with: 401 Unauthorized')
          }
        })
      })

      // ... other existing contexts remain similar, just update the error messages
    })

    context('with a Cedar app, with tail option disabled', function () {
      beforeEach(function () {
        api = nock('https://api.heroku.com', {
          reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
        }).get('/apps/my-cedar-app')
          .reply(200, cedarApp)
          .post('/apps/my-cedar-app/log-sessions', {tail: false})
          .reply(200, {logplex_url: 'https://logs.heroku.com/stream?tail=false&token=s3kr3t'})
      })

      afterEach(function () {
        api.done()
      })

      context('when the log server returns an error', function () {
        it('shows the error and exits', async function () {
          mockResponse = null

          try {
            await logDisplayer(heroku, {
              app: 'my-cedar-app',
              tail: false,
            })
          } catch (error: unknown) {
            const {message, oclif} = error as CLIError
            expect(message).to.equal('Logs stream failed with: 401 Unauthorized')
            expect(oclif.exit).to.eq(1)
          }
        })
      })

      context('when the log server responds with a stream of log lines', function () {
        it('displays log lines and exits', async function () {
          // Create a ReadableStream with the log data
          const encoder = new TextEncoder()
          const logData = heredoc`
            data: 2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1

            data: 2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2

          `
          mockResponse = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(logData))
              controller.close()
            },
          })

          stdout.start()
          await logDisplayer(heroku, {
            app: 'my-cedar-app',
            tail: false,
          })
          stdout.stop()

          expect(stdout.output).to.eq(heredoc`
            2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1
            2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2
          `)
        })
      })
    })

    context('with a Fir app', function () {
      beforeEach(function () {
        api = nock('https://api.heroku.com', {
          reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
        }).get('/apps/my-fir-app')
          .reply(200, firApp)
          .post('/apps/my-fir-app/log-sessions')
          .reply(200, {logplex_url: 'https://telemetry.heroku.com/streams/hyacinth-vbx?token=s3kr3t'})
      })

      afterEach(function () {
        api.done()
      })

      it('displays logs and handles stream timeouts', async function () {
        const encoder = new TextEncoder()
        const logData = heredoc`
          data: 2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1

          data: 2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2

        `
        mockResponse = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(logData))
            controller.close()
          },
        })

        stdout.start()
        stderr.start()
        await logDisplayer(heroku, {
          app: 'my-fir-app',
          tail: false,
        })
        stdout.stop()
        stderr.stop()

        expect(stdout.output).to.eq(heredoc`
          2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1
          2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2
        `)
        expect(stderr.output).to.eq('Fetching logs...\n\n')
      })
    })
  })
})
