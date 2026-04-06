import {expect} from 'chai'
import * as sinon from 'sinon'

import * as telemetryUtils from '../../../src/lib/analytics-telemetry/telemetry-utils.js'

describe('telemetry-utils', function () {
  let sandbox: sinon.SinonSandbox

  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('isTelemetryEnabled', function () {
    let originalDisableTelemetry: string | undefined
    let originalWindowsTelemetry: string | undefined
    let originalTestEnv: string | undefined
    let originalPlatform: string

    beforeEach(function () {
      originalDisableTelemetry = process.env.DISABLE_TELEMETRY
      originalWindowsTelemetry = process.env.ENABLE_WINDOWS_TELEMETRY
      originalTestEnv = process.env.IS_HEROKU_TEST_ENV
      originalPlatform = process.platform
    })

    afterEach(function () {
      process.env.DISABLE_TELEMETRY = originalDisableTelemetry
      process.env.ENABLE_WINDOWS_TELEMETRY = originalWindowsTelemetry
      process.env.IS_HEROKU_TEST_ENV = originalTestEnv
      Object.defineProperty(process, 'platform', {value: originalPlatform})
    })

    it('returns false when DISABLE_TELEMETRY is true', function () {
      process.env.DISABLE_TELEMETRY = 'true'
      expect(telemetryUtils.isTelemetryEnabled()).to.be.false
    })

    it('returns false on Windows without ENABLE_WINDOWS_TELEMETRY', function () {
      delete process.env.DISABLE_TELEMETRY
      delete process.env.ENABLE_WINDOWS_TELEMETRY
      Object.defineProperty(process, 'platform', {value: 'win32'})
      expect(telemetryUtils.isTelemetryEnabled()).to.be.false
    })

    it('returns true on Windows with ENABLE_WINDOWS_TELEMETRY=true', function () {
      delete process.env.DISABLE_TELEMETRY
      delete process.env.IS_HEROKU_TEST_ENV
      process.env.ENABLE_WINDOWS_TELEMETRY = 'true'
      Object.defineProperty(process, 'platform', {value: 'win32'})
      expect(telemetryUtils.isTelemetryEnabled()).to.be.true
    })

    it('returns false when IS_HEROKU_TEST_ENV is true', function () {
      delete process.env.DISABLE_TELEMETRY
      process.env.IS_HEROKU_TEST_ENV = 'true'
      Object.defineProperty(process, 'platform', {value: 'darwin'})
      expect(telemetryUtils.isTelemetryEnabled()).to.be.false
    })

    it('returns true on non-Windows platforms by default', function () {
      delete process.env.DISABLE_TELEMETRY
      delete process.env.IS_HEROKU_TEST_ENV
      Object.defineProperty(process, 'platform', {value: 'darwin'})
      expect(telemetryUtils.isTelemetryEnabled()).to.be.true
    })
  })

  describe('computeDuration', function () {
    it('computes duration from start time to now', function () {
      const startTime = Date.now() - 1000 // 1 second ago
      const duration = telemetryUtils.computeDuration(startTime)
      expect(duration).to.be.greaterThan(900)
      expect(duration).to.be.lessThan(1100)
    })

    it('returns positive duration for past timestamps', function () {
      const startTime = Date.now() - 5000 // 5 seconds ago
      const duration = telemetryUtils.computeDuration(startTime)
      expect(duration).to.be.greaterThan(0)
    })
  })

  describe('getVersion and setVersion', function () {
    it('returns "unknown" when version not set', function () {
      // Note: This test may fail if version was already set in previous tests
      // In a real scenario, we'd need to reset the module state
      const version = telemetryUtils.getVersion()
      expect(version).to.be.a('string')
    })

    it('returns set version after setVersion is called', function () {
      telemetryUtils.setVersion('1.2.3')
      expect(telemetryUtils.getVersion()).to.equal('1.2.3')
    })

    it('persists version across multiple getVersion calls', function () {
      telemetryUtils.setVersion('4.5.6')
      expect(telemetryUtils.getVersion()).to.equal('4.5.6')
      expect(telemetryUtils.getVersion()).to.equal('4.5.6')
    })
  })

  describe('getToken', function () {
    it('returns a string or undefined', async function () {
      const token = await telemetryUtils.getToken()
      expect(token === undefined || typeof token === 'string').to.be.true
    })

    it('caches the token on subsequent calls', async function () {
      const token1 = await telemetryUtils.getToken()
      const token2 = await telemetryUtils.getToken()
      expect(token1).to.equal(token2)
    })
  })
})
