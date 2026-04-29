import * as Sentry from '@sentry/node'

import {PII_PATTERNS} from '../data-scrubber/patterns.js'
import {GDPR_FIELDS, HEROKU_FIELDS, PCI_FIELDS} from '../data-scrubber/presets.js'
import {Scrubber} from '../data-scrubber/scrubber.js'
import {
  CLIError, getVersion, isDev, isTelemetryEnabled, telemetryDebug,
} from './telemetry-utils.js'

export default class SentryClient {
  private client: ReturnType<typeof Sentry.init> | undefined
  private isInitialized = false
  private scrubber: Scrubber

  constructor() {
    this.scrubber = new Scrubber({
      fields: [...HEROKU_FIELDS, ...GDPR_FIELDS, ...PCI_FIELDS],
      patterns: [...PII_PATTERNS],
    })
  }

  /**
   * Send error data to Sentry
   */
  async send(data: CLIError): Promise<void> {
    this.ensureInitialized()
    try {
      telemetryDebug('Sentry payload: %O', {
        code: data.code,
        context: data.context,
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
    }
  }

  /**
   * Ensure Sentry is initialized (lazy initialization)
   */
  private ensureInitialized(): void {
    if (this.isInitialized || !isTelemetryEnabled()) {
      return
    }

    telemetryDebug('Initializing Sentry...')
    this.isInitialized = true

    this.client = Sentry.init({
      beforeSend: event => this.scrubber.scrub(event).data,
      dsn: 'https://76530569188e7ee2961373f37951d916@o4508609692368896.ingest.us.sentry.io/4508767754846208',
      environment: isDev ? 'development' : 'production',
      release: getVersion(),
      skipOpenTelemetrySetup: true, // needed since we have our own OTEL setup
      tracesSampleRate: 1, // needed to ensure we send OTEL data to Honeycomb
    })
    telemetryDebug('Sentry initialized (environment: %s, release: %s)', isDev ? 'development' : 'production', getVersion())
  }
}
