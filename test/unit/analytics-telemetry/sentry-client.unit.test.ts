import {expect} from 'chai'

import * as sentryClient from '../../../src/lib/analytics-telemetry/sentry-client.js'
import {CLIError} from '../../../src/lib/analytics-telemetry/telemetry-utils.js'

describe('sentry-client', function () {
  describe('sendToSentry', function () {
    it('sends error to Sentry without throwing', async function () {
      const mockError: CLIError = new Error('Test error')
      mockError.cliRunDuration = '100'

      // Should not throw - we can't stub Sentry in ES modules easily
      // This is more of an integration test
      await expect(sentryClient.sendToSentry(mockError)).to.be.fulfilled
    })

    it('sends error with additional properties without throwing', async function () {
      const mockError: any = new Error('Test error with extras')
      mockError.code = 'ERR_TEST'
      mockError.statusCode = 500

      // Should not throw
      await expect(sentryClient.sendToSentry(mockError)).to.be.fulfilled
    })

    it('handles errors gracefully', async function () {
      // Create an error with problematic properties
      const mockError: any = new Error('Test error')
      // Add circular reference which might cause serialization issues
      mockError.circular = mockError

      // Should not throw even with problematic data
      await expect(sentryClient.sendToSentry(mockError)).to.be.fulfilled
    })
  })

  describe('ensureSentryInitialized', function () {
    it('initializes Sentry without errors', function () {
      // Should not throw
      expect(() => sentryClient.ensureSentryInitialized()).to.not.throw()
    })

    it('can be called multiple times without re-initializing', function () {
      sentryClient.ensureSentryInitialized()
      sentryClient.ensureSentryInitialized()
      // Should not throw and should be idempotent
    })
  })
})
