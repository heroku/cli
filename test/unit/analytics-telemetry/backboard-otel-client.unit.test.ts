import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import BackboardOtelClient from '../../../src/lib/analytics-telemetry/backboard-otel-client.js'
import {Telemetry} from '../../../src/lib/analytics-telemetry/telemetry-utils.js'

const isDev = process.env.IS_DEV_ENVIRONMENT === 'true'

describe('backboard-otel-client', function () {
  let sandbox: sinon.SinonSandbox
  let client: BackboardOtelClient
  let originalTestEnv: string | undefined

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    // Temporarily enable telemetry for these tests
    originalTestEnv = process.env.IS_HEROKU_TEST_ENV
    delete process.env.IS_HEROKU_TEST_ENV
    client = new BackboardOtelClient()
  })

  afterEach(function () {
    sandbox.restore()
    nock.cleanAll()
    // Restore test environment
    if (originalTestEnv !== undefined) {
      process.env.IS_HEROKU_TEST_ENV = originalTestEnv
    }
  })

  describe('send', function () {
    const mockTelemetry: Telemetry = {
      _type: 'otel',
      cliRunDuration: 100,
      command: 'test:command',
      commandRunDuration: 50,
      exitCode: 0,
      exitState: 'successful',
      isTTY: true,
      isVersionOrHelp: false,
      lifecycleHookCompletion: {
        command_not_found: false,
        init: true,
        postrun: true,
        prerun: true,
      },
      os: 'darwin',
      version: '1.0.0',
    }

    it('sends telemetry data to Honeycomb', async function () {
      const honeycombAPI = nock(
        isDev ? 'https://backboard.staging.herokudev.com' : 'https://backboard.heroku.com',
      )
        .post('/otel/v1/traces')
        .reply(200)

      await client.send(mockTelemetry)
      honeycombAPI.done()
    })

    it('sends error data to Honeycomb', async function () {
      const mockError = new Error('Test error') as any
      mockError.cliRunDuration = 123

      const honeycombAPI = nock(
        isDev ? 'https://backboard.staging.herokudev.com' : 'https://backboard.heroku.com',
      )
        .post('/otel/v1/traces')
        .reply(200)

      await client.send(mockError)
      honeycombAPI.done()
    })

    it('handles errors gracefully', async function () {
      const honeycombAPI = nock(
        isDev ? 'https://backboard.staging.herokudev.com' : 'https://backboard.heroku.com',
      )
        .post('/otel/v1/traces')
        .replyWithError('Network error')

      // Should not throw
      await client.send(mockTelemetry)
    })
  })

  describe('getProcessor', function () {
    it('returns a BatchSpanProcessor', async function () {
      const processor = await client.getProcessor()
      expect(processor).to.exist
      expect(processor).to.have.property('forceFlush')
    })

    it('returns the same processor on multiple calls', async function () {
      const processor1 = await client.getProcessor()
      const processor2 = await client.getProcessor()
      expect(processor1).to.equal(processor2)
    })
  })
})
