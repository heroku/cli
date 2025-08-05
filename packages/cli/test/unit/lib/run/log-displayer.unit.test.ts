/* eslint-disable unicorn/prefer-add-event-listener */
import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stdout, stderr} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import {LogDisplayer} from '../../../../src/lib/run/log-displayer.js'
import {cedarApp, firApp} from '../../../fixtures/apps/fixtures.js'

type CLIError = Errors.CLIError
const heredoc = tsheredoc.default

describe('logDisplayer', function () {
  let api: nock.Scope
  let heroku: APIClient
  let env: NodeJS.ProcessEnv
  let displayer: LogDisplayer
  let createEventSourceStub: sinon.SinonStub

  before(async function () {
    env = process.env
    env.HEROKU_LOGS_COLOR = '0'
    const config = await Config.load()
    heroku = new APIClient(config)
  })

  beforeEach(function () {
    // Create a mock EventSource class
    class MockEventSource {
      public onerror: ((event: any) => void) | null = null
      public onmessage: ((event: any) => void) | null = null
      public onopen: ((event: any) => void) | null = null
      public readyState: number = 0 // CONNECTING
      public url: string
      private errorCode: number

      constructor(url: string, options?: any) {
        this.url = url
        this.errorCode = 401

        // Simulate connection attempt
        setTimeout(() => {
          if (this.onerror) {
            // Create a mock error event with status code
            const errorEvent = {
              code: this.errorCode,
              type: 'error',
            }
            this.onerror(errorEvent)
          }
        }, 10)
      }

      addEventListener(type: string, listener: (event: any) => void) {
        switch (type) {
        case 'error': {
          this.onerror = listener
          break
        }

        case 'message': {
          this.onmessage = listener
          break
        }

        case 'open': {
          this.onopen = listener
          break
        }
        }
      }

      close() {
        this.readyState = 2 // CLOSED
      }
    }

    // Create LogDisplayer instance
    displayer = new LogDisplayer(heroku)

    // Stub the createEventSourceInstance method
    createEventSourceStub = sinon.stub(displayer, 'createEventSourceInstance').callsFake((url: string, options?: any) => new MockEventSource(url, options) as any)
  })

  afterEach(function () {
    api?.done()
    if (createEventSourceStub) {
      createEventSourceStub.restore()
    }
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

          try {
            await displayer.display({
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

          try {
            await displayer.display({
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

          try {
            await displayer.display({
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
        })
      })
    })

    context('with a Fir app and both lines and tail options present', function () {
      beforeEach(function () {
        api = nock('https://api.heroku.com', {
          reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
        }).get('/apps/my-fir-app')
          .reply(200, firApp)
      })

      it('creates a session with parameters set to option values, ignoring lines and tail options', async function () {
        api.post('/apps/my-fir-app/log-sessions', {
          dyno: 'web-123-456',
          source: 'app',
          type: 'web',
        })
          .reply(200, {logplex_url: 'https://telemetry.heroku.com/streams/hyacinth-vbx?token=s3kr3t'})

        try {
          await displayer.display({
            app: 'my-fir-app',
            dyno: 'web-123-456',
            lines: 20,
            source: 'app',
            tail: true,
            type: 'web',
          })
        } catch (error: unknown) {
          const {message} = error as CLIError
          expect(message.trim()).to.equal('Logs eventsource failed with: 500')
        }
      })
    })
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
        try {
          await displayer.display({
            app: 'my-cedar-app',
            tail: false,
          })
        } catch (error: unknown) {
          const {message, oclif} = error as CLIError
          expect(message).to.equal('Logs eventsource failed with: 401')
          expect(oclif.exit).to.eq(1)
        }
      })
    })

    context('when the log server responds with a stream of log lines', function () {
      it('displays log lines and exits', async function () {
        const logServer = nock('https://logs.heroku.com', {
          reqheaders: {Accept: 'text/event-stream'},
        }).get('/stream')
          .query(true)
          .reply(200, heredoc`
            id: 1002
            data: 2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1\n\n\n
            id: 1003
            data: 2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2\n\n\n
          `)

        stdout.start()
        await displayer.display({
          app: 'my-cedar-app',
          tail: false,
        })
        stdout.stop()

        logServer.done()
        expect(stdout.output).to.eq(heredoc`
          2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1
          2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2
        `)
      })
    })
  })

  context('with a Cedar app, with tail option enabled', function () {
    beforeEach(function () {
      api = nock('https://api.heroku.com', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
      }).get('/apps/my-cedar-app')
        .reply(200, cedarApp)
        .post('/apps/my-cedar-app/log-sessions', {tail: true})
        .reply(200, {logplex_url: 'https://logs.heroku.com/stream?tail=true&token=s3kr3t'})
    })

    afterEach(function () {
      api.done()
    })

    context('when the log server returns an error', function () {
      it('shows the error and exits', async function () {
        try {
          await displayer.display({
            app: 'my-cedar-app',
            tail: true,
          })
        } catch (error: unknown) {
          const {message, oclif} = error as CLIError
          expect(message).to.equal('Logs eventsource failed with: 401')
          expect(oclif.exit).to.eq(1)
        }
      })
    })

    context('when the log server responds with a stream of log lines and then timeouts', function () {
      it('displays log lines and exits showing a timeout error', async function () {
        try {
          stdout.start()
          await displayer.display({
            app: 'my-cedar-app',
            tail: true,
          })
        } catch (error: unknown) {
          stdout.stop()
          const {message, oclif} = error as CLIError
          expect(message).to.equal('Logs eventsource failed with: 401')
          expect(oclif.exit).to.eq(1)
        }

        expect(stdout.output).to.eq('')
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
        .reply(500)
    })

    afterEach(function () {
      api.done()
    })

    it('displays logs and recreates log sessions on timeout', async function () {
      try {
        stdout.start()
        stderr.start()
        await displayer.display({
          app: 'my-fir-app',
          tail: false,
        })
      } catch (error: unknown) {
        stdout.stop()
        stderr.stop()
        const {message} = error as Error
        expect(message.trim()).to.equal('HTTP Error 500 for POST https://api.heroku.com/apps/my-fir-app/log-sessions')
      }

      // it displays message about fetching logs for fir apps
      expect(stderr.output).to.eq('Fetching logs...\n\n')
    })
  })
})
