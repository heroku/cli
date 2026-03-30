import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import * as honeycombClient from '../../../src/lib/analytics-telemetry/honeycomb-client.js'
import {Telemetry} from '../../../src/lib/analytics-telemetry/telemetry-utils.js'

const isDev = process.env.IS_DEV_ENVIRONMENT === 'true'

describe('honeycomb-client', function () {
  let sandbox: sinon.SinonSandbox

  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
    nock.cleanAll()
  })

  describe('sendToHoneycomb', function () {
    const mockTelemetry: Telemetry = {
      cliRunDuration: 100,
      command: 'test:command',
      commandRunDuration: 50,
      exitCode: 0,
      exitState: 'successful',
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

      await honeycombClient.sendToHoneycomb(mockTelemetry)
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

      await honeycombClient.sendToHoneycomb(mockError)
      honeycombAPI.done()
    })

    it('handles errors gracefully', async function () {
      const honeycombAPI = nock(
        isDev ? 'https://backboard.staging.herokudev.com' : 'https://backboard.heroku.com',
      )
        .post('/otel/v1/traces')
        .replyWithError('Network error')

      // Should not throw
      await honeycombClient.sendToHoneycomb(mockTelemetry)
    })
  })

  describe('getProcessor', function () {
    it('returns a BatchSpanProcessor', function () {
      const processor = honeycombClient.getProcessor()
      expect(processor).to.exist
      expect(processor).to.have.property('forceFlush')
    })

    it('returns the same processor on multiple calls', function () {
      const processor1 = honeycombClient.getProcessor()
      const processor2 = honeycombClient.getProcessor()
      expect(processor1).to.equal(processor2)
    })
  })

  describe('initializeInstrumentation', function () {
    it('initializes instrumentation without errors', function () {
      // Should not throw
      expect(() => honeycombClient.initializeInstrumentation()).to.not.throw()
    })
  })
})
