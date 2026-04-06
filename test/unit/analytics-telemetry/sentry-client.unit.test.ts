import {expect} from 'chai'

import SentryClient from '../../../src/lib/analytics-telemetry/sentry-client.js'
import {CLIError} from '../../../src/lib/analytics-telemetry/telemetry-utils.js'

describe('sentry-client', function () {
  let client: SentryClient

  beforeEach(function () {
    client = new SentryClient()
  })

  describe('send', function () {
    it('sends error to Sentry without throwing', async function () {
      const mockError: CLIError = new Error('Test error')
      mockError.cliRunDuration = '100'

      // Should not throw - we can't stub Sentry in ES modules easily
      // This is more of an integration test
      await expect(client.send(mockError)).to.be.fulfilled
    })

    it('sends error with additional properties without throwing', async function () {
      const mockError: any = new Error('Test error with extras')
      mockError.code = 'ERR_TEST'
      mockError.statusCode = 500

      // Should not throw
      await expect(client.send(mockError)).to.be.fulfilled
    })

    it('handles errors gracefully', async function () {
      // Create an error with problematic properties
      const mockError: any = new Error('Test error')
      // Add circular reference which might cause serialization issues
      mockError.circular = mockError

      // Should not throw even with problematic data
      await expect(client.send(mockError)).to.be.fulfilled
    })

    it('can be called multiple times (idempotent initialization)', async function () {
      const mockError: CLIError = new Error('Test error')

      // Should not throw when called multiple times
      await expect(client.send(mockError)).to.be.fulfilled
      await expect(client.send(mockError)).to.be.fulfilled
    })
  })
})
