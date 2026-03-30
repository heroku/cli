import * as Sentry from '@sentry/node'
import debug from 'debug'

import {PII_PATTERNS} from '../data-scrubber/patterns.js'
import {GDPR_FIELDS, HEROKU_FIELDS, PCI_FIELDS} from '../data-scrubber/presets.js'
import {Scrubber} from '../data-scrubber/scrubber.js'
import {
  CLIError, getVersion, isDev, isTelemetryDisabled, telemetryDebug,
} from './telemetry-utils.js'

// Lazy-loaded state
let isSentryInitialized = false
let sentryClient: ReturnType<typeof Sentry.init> | undefined

/**
 * Ensure Sentry is initialized (lazy initialization)
 */
export function ensureSentryInitialized(): void {
  if (isSentryInitialized || isTelemetryDisabled) {
    return
  }

  telemetryDebug('Initializing Sentry...')
  isSentryInitialized = true

  const scrubber = new Scrubber({
    fields: [...HEROKU_FIELDS, ...GDPR_FIELDS, ...PCI_FIELDS],
    patterns: [...PII_PATTERNS],
  })

  sentryClient = Sentry.init({
    beforeSend(event) {
      return scrubber.scrub(event).data
    },
    dsn: 'https://76530569188e7ee2961373f37951d916@o4508609692368896.ingest.us.sentry.io/4508767754846208',
    environment: isDev ? 'development' : 'production',
    release: getVersion(),
    skipOpenTelemetrySetup: true, // needed since we have our own OTEL setup
    tracesSampleRate: 1, // needed to ensure we send OTEL data to Honeycomb
  })
  telemetryDebug('Sentry initialized (environment: %s, release: %s)', isDev ? 'development' : 'production', getVersion())
}

/**
 * Send error data to Sentry
 */
export async function sendToSentry(data: CLIError): Promise<void> {
  // Lazy-load Sentry only when we actually need to report an error
  ensureSentryInitialized()
  try {
    telemetryDebug('Sentry payload: %O', {
      code: data.code,
      message: data.message,
      name: data.name,
      stack: data.stack,
      statusCode: data.statusCode,
    })
    telemetryDebug('Capturing exception in Sentry: %s', data.message)
    Sentry.captureException(data)
    // ensures all events are sent to Sentry before exiting.
    await Sentry.flush()
    telemetryDebug('Successfully flushed error to Sentry')
  } catch (error) {
    telemetryDebug('Error sending to Sentry: %O', error)
    debug('Could not send error report')
  }
}
