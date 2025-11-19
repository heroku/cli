/* eslint-disable max-nested-callbacks */
import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {CLIError} from '@oclif/core/lib/errors'
import {expect} from 'chai'
import * as nock from 'nock'
import logDisplayer from '../../../../src/lib/run/log-displayer'
import {cedarApp} from '../../../fixtures/apps/fixtures'

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
})
