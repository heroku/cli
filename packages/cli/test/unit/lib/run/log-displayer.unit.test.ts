/* eslint-disable max-nested-callbacks */
import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {CLIError} from '@oclif/core/lib/errors'
import {expect} from 'chai'
import {EventEmitter} from 'node:events'
import * as nock from 'nock'
import * as proxyquire from 'proxyquire'
import * as sinon from 'sinon'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import logDisplayer from '../../../../src/lib/run/log-displayer'
import {cedarApp, firApp} from '../../../fixtures/apps/fixtures'

describe('logDisplayer', function () {
  let api: nock.Scope
  let heroku: APIClient
  let env: NodeJS.ProcessEnv

  before(async function () {
    env = process.env
    env.HEROKU_LOGS_COLOR = '0'
    const config = await Config.load()
    heroku = new APIClient(config)
  })

  after(function () {
    process.env = env
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

          const logServer = nock('https://logs.heroku.com', {
            reqheaders: {Accept: 'text/event-stream'},
          }).get('/stream')
            .query(true)
            .reply(401)

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
            expect(message).to.equal('Logs eventsource failed with: 401')
          }

          logServer.done()
        })
      })

      context('with type and no dyno options', function () {
        it('creates a log session with dyno parameter set to the type option value', async function () {
          api
            .post('/apps/my-cedar-app/log-sessions', {
              dyno: 'web',
              lines: 20,
              source: 'app',
              tail: true,
            })
            .reply(200, {logplex_url: 'https://logs.heroku.com/stream?tail=true&token=s3kr3t'})

          const logServer = nock('https://logs.heroku.com', {
            reqheaders: {Accept: 'text/event-stream'},
          }).get('/stream')
            .query(true)
            .reply(401)

          try {
            await logDisplayer(heroku, {
              app: 'my-cedar-app',
              lines: 20,
              source: 'app',
              tail: true,
              type: 'web',
            })
          } catch (error: unknown) {
            const {message} = error as CLIError
            expect(message).to.equal('Logs eventsource failed with: 401')
          }

          logServer.done()
        })
      })

      context('with both type and dyno options', function () {
        it('creates a log session with dyno parameter set to the option value, ignoring type', async function () {
          api
            .post('/apps/my-cedar-app/log-sessions', {
              dyno: 'web.1',
              lines: 20,
              source: 'app',
              tail: true,
            })
            .reply(200, {logplex_url: 'https://logs.heroku.com/stream?tail=true&token=s3kr3t'})

          const logServer = nock('https://logs.heroku.com', {
            reqheaders: {Accept: 'text/event-stream'},
          }).get('/stream')
            .query(true)
            .reply(401)

          try {
            await logDisplayer(heroku, {
              app: 'my-cedar-app',
              dyno: 'web.1',
              lines: 20,
              source: 'app',
              tail: true,
              type: 'web',
            })
          } catch (error: unknown) {
            const {message} = error as CLIError
            expect(message).to.equal('Logs eventsource failed with: 401')
          }

          logServer.done()
        })
      })
    })
  })

  context('with a Fir app', function () {
    let api: nock.Scope
    let mockEventSourceInstance: EventEmitter
    let logDisplayerWithMock: typeof logDisplayer

    // Mock EventSource class that extends EventEmitter
    class MockEventSource extends EventEmitter {
      url: string
      close: () => void
      static lastInstance: EventEmitter | null = null

      constructor(url: string, _options?: {proxy?: string; headers?: Record<string, string>}) {
        super()
        this.url = url
        this.close = () => {
          this.removeAllListeners()
        }

        // Store instance for test control
        MockEventSource.lastInstance = this
        mockEventSourceInstance = MockEventSource.lastInstance
      }

      // EventSource uses addEventListener, not just on()
      addEventListener(event: string, handler: (e: any) => void) {
        this.on(event, handler)
      }
    }

    beforeEach(function () {
      nock.cleanAll()
      api = nock('https://api.heroku.com', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
      }).get('/apps/my-fir-app')
        .reply(200, firApp)

      sinon.stub(heroku, 'post').resolves({
        body: {logplex_url: 'https://logs.heroku.com/stream?tail=true&token=s3kr3t'},
      } as any)

      logDisplayerWithMock = proxyquire('../../../../src/lib/run/log-displayer', {
        '@heroku/eventsource': MockEventSource,
      }).default
    })

    afterEach(function () {
      api.done()
      sinon.restore()
      mockEventSourceInstance = null as any
    })

    context('when the log server returns a 403 error before connection', function () {
      it('shows the IP address access error and exits', async function () {
        const promise = logDisplayerWithMock(heroku, {
          app: 'my-fir-app',
          tail: true,
        })

        const waitForInstance = () => {
          if (mockEventSourceInstance) {
            mockEventSourceInstance.emit('error', {status: 403, message: null})
          } else {
            setImmediate(waitForInstance)
          }
        }

        setImmediate(waitForInstance)

        try {
          await promise
        } catch (error: unknown) {
          const {message, oclif} = error as CLIError
          expect(message).to.equal("You can't access this space from your IP address. Contact your team admin.")
          expect(oclif.exit).to.eq(1)
        }
      })
    })

    context('when the log server returns a 403 error after connection', function () {
      it('shows the stream access expired error and exits', async function () {
        stdout.start()

        const promise = logDisplayerWithMock(heroku, {
          app: 'my-fir-app',
          tail: true,
        })

        const waitAndEmit = () => {
          if (mockEventSourceInstance) {
            mockEventSourceInstance.emit('message', {data: '2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1'})
            mockEventSourceInstance.emit('message', {data: '2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2'})
            // Use process.nextTick to ensure message handlers complete before emitting error
            process.nextTick(() => {
              mockEventSourceInstance.emit('error', {status: 403, message: null})
            })
          } else {
            setImmediate(waitAndEmit)
          }
        }

        setImmediate(waitAndEmit)

        try {
          await promise
        } catch (error: unknown) {
          stdout.stop()
          const {message, oclif} = error as CLIError
          expect(message).to.equal('Log stream access expired. Please try again.')
          expect(oclif.exit).to.eq(1)
        }

        expect(stdout.output).to.eq(heredoc`
          2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1
          2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2
        `)
      })
    })

    context('when the log server returns a 404 error', function () {
      it('shows the stream access expired error and exits', async function () {
        const promise = logDisplayerWithMock(heroku, {
          app: 'my-fir-app',
          tail: true,
        })

        const waitForInstance = () => {
          if (mockEventSourceInstance) {
            mockEventSourceInstance.emit('error', {status: 404, message: null})
          } else {
            setImmediate(waitForInstance)
          }
        }

        setImmediate(waitForInstance)

        try {
          await promise
        } catch (error: unknown) {
          const {message, oclif} = error as CLIError
          expect(message).to.equal('Log stream access expired. Please try again.')
          expect(oclif.exit).to.eq(1)
        }
      })
    })
  })
})
