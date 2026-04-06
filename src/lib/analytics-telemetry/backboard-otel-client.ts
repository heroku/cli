import opentelemetry, {SpanStatusCode} from '@opentelemetry/api'
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http'
import {Resource} from '@opentelemetry/resources'
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-base'
import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node'
import {SemanticResourceAttributes} from '@opentelemetry/semantic-conventions'
import debug from 'debug'

import {
  CLIError,
  getToken,
  getVersion,
  isDev,
  isTelemetryEnabled,
  TelemetryData,
  telemetryDebug,
} from './telemetry-utils.js'

// Module-level singleton for OTEL provider and processor
// This avoids conflicts with global OpenTelemetry registry
let isInitialized = false
let processor: BatchSpanProcessor
let provider: NodeTracerProvider

export default class BackboardOtelClient {
  /**
   * Get the BatchSpanProcessor (for backward compatibility)
   */
  async getProcessor(): Promise<BatchSpanProcessor> {
    await this.ensureInitialized()
    return processor
  }

  /**
   * Send telemetry data to Backboard (forwarded to Honeycomb) via OpenTelemetry
   */
  async send(data: TelemetryData): Promise<void> {
    await this.ensureInitialized()
    try {
      const tracer = opentelemetry.trace.getTracer('heroku-cli', getVersion())
      const span = tracer.startSpan('node_app_execution')
      telemetryDebug('Created span: node_app_execution')

      if (data instanceof Error) {
        const errorData = data as CLIError
        telemetryDebug('Honeycomb payload (error): %O', {
          cliRunDuration: errorData.cliRunDuration,
          code: errorData.code,
          message: errorData.message,
          name: errorData.name,
          stack: errorData.stack,
        })
        span.recordException(data)
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: data.message,
        })
        telemetryDebug('Recorded exception in span: %s', data.message)
      } else {
        telemetryDebug('Honeycomb payload (telemetry): %O', {
          cliRunDuration: data.cliRunDuration,
          command: data.command,
          commandRunDuration: data.commandRunDuration,
          exitCode: data.exitCode,
          exitState: data.exitState,
          isTTY: data.isTTY,
          lifecycleHookCompletion: data.lifecycleHookCompletion,
          os: data.os,
          version: data.version,
        })
        span.setAttribute('heroku_client.command', data.command)
        span.setAttribute('heroku_client.os', data.os)
        span.setAttribute('heroku_client.version', data.version)
        span.setAttribute('heroku_client.exit_code', data.exitCode)
        span.setAttribute('heroku_client.exit_state', data.exitState)
        span.setAttribute('heroku_client.cli_run_duration', data.cliRunDuration)
        span.setAttribute('heroku_client.command_run_duration', data.commandRunDuration)
        span.setAttribute('heroku_client.lifecycle_hook.init', data.lifecycleHookCompletion.init)
        span.setAttribute('heroku_client.lifecycle_hook.prerun', data.lifecycleHookCompletion.prerun)
        span.setAttribute('heroku_client.lifecycle_hook.postrun', data.lifecycleHookCompletion.postrun)
        span.setAttribute('heroku_client.lifecycle_hook.command_not_found', data.lifecycleHookCompletion.command_not_found)
        telemetryDebug('Set span attributes for command: %s (duration: %dms)', data.command, data.cliRunDuration)
      }

      span.end()
      telemetryDebug('Span ended, flushing to exporter...')
      const processor = await this.getProcessor()
      await processor.forceFlush()
      telemetryDebug('Successfully flushed telemetry to Honeycomb')
    } catch (error) {
      telemetryDebug('Error sending telemetry to Honeycomb: %O', error)
      debug('could not send telemetry')
    }
  }

  /**
   * Ensure OpenTelemetry is initialized (lazy initialization)
   */
  private async ensureInitialized(): Promise<void> {
    if (isInitialized || !isTelemetryEnabled()) {
      return
    }

    telemetryDebug('Initializing OpenTelemetry...')
    isInitialized = true

    const resource = Resource
      .default()
      .merge(
        new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: 'heroku-cli',
          [SemanticResourceAttributes.SERVICE_VERSION]: undefined, // will be set later
        }),
      )

    // Initialize without Sentry sampler initially (Sentry loaded lazily)
    provider = new NodeTracerProvider({
      resource,
    })
    telemetryDebug('NodeTracerProvider created')

    // eslint-disable-next-line no-negated-condition, unicorn/no-negated-condition
    const token = process.env.IS_HEROKU_TEST_ENV !== 'true' ? await getToken() : ''
    const headers = {Authorization: `Bearer ${token}`}

    const url = isDev ? 'https://backboard.staging.herokudev.com/otel/v1/traces' : 'https://backboard.heroku.com/otel/v1/traces'
    telemetryDebug('OTLP exporter endpoint: %s', url)

    const exporter = new OTLPTraceExporter({
      compression: undefined,
      headers,
      url,
    })

    processor = new BatchSpanProcessor(exporter)
    provider.addSpanProcessor(processor)
    telemetryDebug('BatchSpanProcessor added to provider')

    // Register the provider to make it the global tracer provider
    // We don't use Sentry context manager here to avoid loading Sentry upfront
    provider.register()
    telemetryDebug('OpenTelemetry provider registered globally')
  }
}
