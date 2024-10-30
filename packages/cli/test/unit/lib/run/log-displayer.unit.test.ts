/* eslint-disable max-nested-callbacks */
import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {CLIError} from '@oclif/core/lib/errors'
import {expect} from 'chai'
import * as nock from 'nock'
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

    context('with a Fir app', function () {
      beforeEach(function () {
        api = nock('https://api.heroku.com', {
          reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
        }).get('/apps/my-fir-app')
          .reply(200, firApp)
      })

      afterEach(function () {
        api.done()
      })

      context('with both lines and tail options present', function () {
        it('creates a session with parameters set to option values, ignoring lines and tail options', async function () {
          api
            .post('/apps/my-fir-app/log-sessions', {
              dyno: 'web-123-456',
              source: 'app',
              type: 'web',
            })
            .reply(200, {logplex_url: 'https://telemetry.heroku.com/streams/hyacinth-vbx?token=s3kr3t'})
            .post('/apps/my-fir-app/log-sessions', {
              dyno: 'web-123-456',
              source: 'app',
              type: 'web',
            })
            .reply(500)

          const logServer = nock('https://telemetry.heroku.com', {
            reqheaders: {Accept: 'text/event-stream'},
          }).get('/streams/hyacinth-vbx')
            .query(true)
            .reply(401)

          try {
            await logDisplayer(heroku, {
              app: 'my-fir-app',
              dyno: 'web-123-456',
              lines: 20,
              source: 'app',
              tail: true,
              type: 'web',
            })
          } catch (error: unknown) {
            const {message} = error as CLIError
            expect(message.trim()).to.equal('HTTP Error 500 for POST https://api.heroku.com/apps/my-fir-app/log-sessions')
          }

          logServer.done()
        })
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
        const logServer = nock('https://logs.heroku.com', {
          reqheaders: {Accept: 'text/event-stream'},
        }).get('/stream')
          .query(true)
          .reply(401)

        try {
          await logDisplayer(heroku, {
            app: 'my-cedar-app',
            tail: false,
          })
        } catch (error: unknown) {
          const {message, oclif} = error as CLIError
          expect(message).to.equal('Logs eventsource failed with: 401')
          expect(oclif.exit).to.eq(1)
        }

        logServer.done()
      })
    })

    context('when the log server responds with a stream of log lines', function () {
      it('displays log lines and exits', async function () {
        const logServer = nock('https://logs.heroku.com', {
          reqheaders: {Accept: 'text/event-stream'},
        }).get('/stream')
          .query(true)
          .reply(200, heredoc`
            Waiting for logs...\n\n
            id: 1002
            data: 2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1\n\n\n
            id: 1003
            data: 2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2\n\n\n
          `)

        stdout.start()
        await logDisplayer(heroku, {
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
        const logServer = nock('https://logs.heroku.com', {
          reqheaders: {Accept: 'text/event-stream'},
        }).get('/stream')
          .query(true)
          .reply(401)

        try {
          await logDisplayer(heroku, {
            app: 'my-cedar-app',
            tail: true,
          })
        } catch (error: unknown) {
          const {message, oclif} = error as CLIError
          expect(message).to.equal('Logs eventsource failed with: 401')
          expect(oclif.exit).to.eq(1)
        }

        logServer.done()
      })
    })

    context('when the log server responds with a stream of log lines and then timeouts', function () {
      it('displays log lines and exits showing a timeout error', async function () {
        const logServer = nock('https://logs.heroku.com', {
          reqheaders: {Accept: 'text/event-stream'},
        }).get('/stream')
          .query(true)
          .reply(200, heredoc`
            Waiting for logs...\n\n
            id: 1002
            data: 2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1\n\n\n
            id: 1003
            data: 2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2\n\n\n
            event: error
            data: {"status": 404, "message": null}\n\n\n
          `)
          .get('/stream')
          .query(true)
          .reply(404)

        try {
          stdout.start()
          await logDisplayer(heroku, {
            app: 'my-cedar-app',
            tail: true,
          })
        } catch (error: unknown) {
          stdout.stop()
          const {message, oclif} = error as CLIError
          expect(message).to.equal('Log stream timed out. Please try again.')
          expect(oclif.exit).to.eq(1)
        }

        logServer.done()
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
        .post('/apps/my-fir-app/log-sessions')
        .reply(200, {logplex_url: 'https://telemetry.heroku.com/streams/hyacinth-vbx?token=0th3r-s3kr3t'})
        .post('/apps/my-fir-app/log-sessions')
        .reply(500)
    })

    afterEach(function () {
      api.done()
    })

    it('displays logs and recreates log sessions on timeout', async function () {
      const logSession1 = nock('https://telemetry.heroku.com', {
        reqheaders: {Accept: 'text/event-stream'},
      }).get('/streams/hyacinth-vbx')
        .query({token: 's3kr3t'})
        .reply(200, heredoc`
          id: 1002
          data: 2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1\n\n\n
          id: 1003
          data: 2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2\n\n\n
        `)

      const logSession2 = nock('https://telemetry.heroku.com', {
        reqheaders: {Accept: 'text/event-stream'},
      }).get('/streams/hyacinth-vbx')
        .query({token: '0th3r-s3kr3t'})
        .reply(200, heredoc`
          id: 1004
          data: 2024-10-17T22:23:24.326810+00:00 app[web.1]: log line 3\n\n\n
        `)

      try {
        stdout.start()
        await logDisplayer(heroku, {
          app: 'my-fir-app',
          tail: false,
        })
      } catch (error: unknown) {
        stdout.stop()
        const {message} = error as Error
        expect(message.trim()).to.equal('HTTP Error 500 for POST https://api.heroku.com/apps/my-fir-app/log-sessions')
      }

      // We would like to test for the output here too, but because we're nuking 'setTimeout' in the test initialization
      // the EventSource objects get closed and abort the initiated requests before emitting the events that are finally
      // sent to stdout. So, we only test that the requests are indeed initiated as expected. Provided setTimeout is
      // given enough time, we would expect the events to be emitted and the output to be there.
      //
      // expect(stdout.output).to.eq(heredoc`
      //   2024-10-17T22:23:22.209776+00:00 app[web.1]: log line 1
      //   2024-10-17T22:23:23.032789+00:00 app[web.1]: log line 2
      //   2024-10-17T22:23:24.326810+00:00 app[web.1]: log line 3
      // `)

      logSession1.done()
      logSession2.done()
    })
  })
})
