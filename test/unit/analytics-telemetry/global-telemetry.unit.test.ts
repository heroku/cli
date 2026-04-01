import {expect} from 'chai'
import nock from 'nock'

import * as globalTelemetry from '../../../src/lib/analytics-telemetry/global-telemetry.js'

const isDev = process.env.IS_DEV_ENVIRONMENT === 'true'

describe('global-telemetry', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  describe('setupTelemetry', function () {
    const mockConfig = {
      platform: 'darwin',
      version: '1.2.3',
    } as any

    it('creates telemetry object for regular command', function () {
      const mockOpts = {
        Command: {
          id: 'apps:info',
        },
      }

      const result = globalTelemetry.setupTelemetry(mockConfig, mockOpts)

      expect(result.command).to.equal('apps:info')
      expect(result.os).to.equal('darwin')
      expect(result.version).to.equal('1.2.3')
      expect(result.exitCode).to.equal(0)
      expect(result.exitState).to.equal('successful')
      expect(result.isVersionOrHelp).to.be.false
      expect(result.lifecycleHookCompletion.init).to.be.true
      expect(result.lifecycleHookCompletion.prerun).to.be.true
      expect(result.lifecycleHookCompletion.postrun).to.be.false
      expect(result.lifecycleHookCompletion.command_not_found).to.be.false
    })

    it('creates telemetry object for version/help command', function () {
      const mockOpts = {
        id: 'version',
      }

      const result = globalTelemetry.setupTelemetry(mockConfig, mockOpts)

      expect(result.command).to.equal('version')
      expect(result.isVersionOrHelp).to.be.true
      expect(result.lifecycleHookCompletion.prerun).to.be.false
    })

    it('includes MCP version when in MCP mode', function () {
      const originalMcpMode = process.env.HEROKU_MCP_MODE
      const originalMcpVersion = process.env.HEROKU_MCP_SERVER_VERSION
      process.env.HEROKU_MCP_MODE = 'true'
      process.env.HEROKU_MCP_SERVER_VERSION = '1.0.0'

      const mockOpts = {
        id: 'version',
      }

      const result = globalTelemetry.setupTelemetry(mockConfig, mockOpts)

      expect(result.version).to.equal('1.2.3 (MCP 1.0.0)')

      process.env.HEROKU_MCP_MODE = originalMcpMode
      process.env.HEROKU_MCP_SERVER_VERSION = originalMcpVersion
    })
  })

  describe('reportCmdNotFound', function () {
    it('creates telemetry object for command not found', function () {
      const mockConfig = {
        platform: 'darwin',
        version: '1.2.3',
      } as any

      const result = globalTelemetry.reportCmdNotFound(mockConfig)

      expect(result.command).to.equal('invalid_command')
      expect(result.exitState).to.equal('command_not_found')
      expect(result.commandRunDuration).to.equal(0)
      expect(result.lifecycleHookCompletion.command_not_found).to.be.true
      expect(result.lifecycleHookCompletion.prerun).to.be.false
      expect(result.lifecycleHookCompletion.postrun).to.be.false
    })
  })

  describe('sendTelemetry', function () {
    it('sends regular telemetry without throwing', async function () {
      const mockTelemetry = {
        _type: 'otel' as const,
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

      // Setup mock HTTP endpoint for Honeycomb
      const honeycombAPI = nock(
        isDev ? 'https://backboard.staging.herokudev.com' : 'https://backboard.heroku.com',
      )
        .post('/otel/v1/traces')
        .reply(200)

      await globalTelemetry.sendTelemetry(mockTelemetry)

      honeycombAPI.done()
    })

    it('sends errors without throwing', async function () {
      const mockError = new Error('Test error')

      // Setup mock HTTP endpoint for Honeycomb
      const honeycombAPI = nock(
        isDev ? 'https://backboard.staging.herokudev.com' : 'https://backboard.heroku.com',
      )
        .post('/otel/v1/traces')
        .reply(200)

      await globalTelemetry.sendTelemetry(mockError)

      honeycombAPI.done()
    })

    it('skips sending when telemetry is disabled', async function () {
      const originalDisableTelemetry = process.env.DISABLE_TELEMETRY
      process.env.DISABLE_TELEMETRY = 'true'

      const mockTelemetry = {
        _type: 'otel' as const,
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

      // Should not make any HTTP calls when telemetry is disabled
      await globalTelemetry.sendTelemetry(mockTelemetry)

      process.env.DISABLE_TELEMETRY = originalDisableTelemetry
    })
  })
})
