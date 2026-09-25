import {expect} from 'chai'

import {isExpectedError} from '../../../src/lib/analytics-telemetry/error-classification.js'
import {CLIError, parseWorkerEnvelope, serializeTelemetryData} from '../../../src/lib/analytics-telemetry/telemetry-utils.js'

const asCLIError = (error: Error, extra: Partial<CLIError> = {}): CLIError =>
  Object.assign(error, extra) as CLIError

// Mirrors telemetry-worker.ts: the parent serializes the error, the detached
// worker reconstructs it as a plain Error before classification runs. This
// guards the fields isExpectedError depends on against a serialization change.
function reconstructLikeWorker(error: CLIError): CLIError {
  const {payload} = parseWorkerEnvelope(serializeTelemetryData(error))
  const parsed = payload as unknown as CLIError
  const reconstructed = new Error(parsed.message) as CLIError
  reconstructed.name = parsed.name
  reconstructed.stack = parsed.stack
  Object.assign(reconstructed, parsed)
  return reconstructed
}

describe('error-classification', function () {
  describe('isExpectedError', function () {
    it('treats a 4xx statusCode as expected', function () {
      expect(isExpectedError(asCLIError(new Error('Bad request'), {statusCode: 400}))).to.be.true
      expect(isExpectedError(asCLIError(new Error('Unauthorized'), {statusCode: 401}))).to.be.true
      expect(isExpectedError(asCLIError(new Error('Not found'), {statusCode: 404}))).to.be.true
    })

    it('treats a 4xx http.statusCode (HerokuAPIError) as expected', function () {
      expect(isExpectedError(asCLIError(new Error('Not found'), {http: {statusCode: 404}}))).to.be.true
    })

    it('does NOT treat 5xx server errors as expected', function () {
      expect(isExpectedError(asCLIError(new Error('Server error'), {statusCode: 500}))).to.be.false
      expect(isExpectedError(asCLIError(new Error('Bad gateway'), {http: {statusCode: 502}}))).to.be.false
    })

    it('treats command-not-found (oclif exit 127) as expected', function () {
      expect(isExpectedError(asCLIError(new Error('foo is not a heroku command.'), {oclif: {exit: 127}}))).to.be.true
    })

    it('treats the command-not-found message as expected', function () {
      const error = new Error('foo is not a heroku command.\nRun heroku help for a list of available commands.')
      expect(isExpectedError(asCLIError(error))).to.be.true
    })

    it('treats SIGINT (Ctrl+C) as expected', function () {
      expect(isExpectedError(asCLIError(new Error('Received SIGINT')))).to.be.true
    })

    it('treats the non-interactive login error code as expected', function () {
      const error = asCLIError(new Error('Cannot prompt for login in a non-interactive terminal.'), {
        code: 'HEROKU_NONINTERACTIVE_LOGIN',
      })
      expect(isExpectedError(error)).to.be.true
    })

    it('treats CI git helper guidance as expected', function () {
      expect(isExpectedError(asCLIError(new Error('Please checkout a branch before running this command')))).to.be.true
      expect(isExpectedError(asCLIError(new Error('Please run this command from the directory containing your project\'s git repo')))).to.be.true
    })

    it('does NOT treat a genuine bug as expected', function () {
      expect(isExpectedError(asCLIError(new Error('Cannot read properties of undefined')))).to.be.false
    })

    describe('survives the worker serialize/reconstruct round-trip', function () {
      it('keeps the non-interactive login code', function () {
        const error = asCLIError(new Error('Cannot prompt for login in a non-interactive terminal.'), {
          code: 'HEROKU_NONINTERACTIVE_LOGIN',
        })
        expect(isExpectedError(error), 'expected before serialization').to.be.true
        expect(isExpectedError(reconstructLikeWorker(error)), 'still expected after round-trip').to.be.true
      })

      it('keeps a 4xx http.statusCode', function () {
        const error = asCLIError(new Error('Not found'), {http: {statusCode: 404}})
        expect(isExpectedError(reconstructLikeWorker(error))).to.be.true
      })
    })
  })
})
