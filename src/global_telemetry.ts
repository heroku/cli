import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core/config'
import opentelemetry, {SpanStatusCode} from '@opentelemetry/api'
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http'
import {Resource} from '@opentelemetry/resources'
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-base'
import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node'
import {SemanticResourceAttributes} from '@opentelemetry/semantic-conventions'
import * as Sentry from '@sentry/node'
import {SentryPropagator} from '@sentry/opentelemetry'
import debug from 'debug'
import path from 'path'
import {fileURLToPath} from 'url'

import {PII_PATTERNS} from './lib/data-scrubber/patterns.js'
import {GDPR_FIELDS, HEROKU_FIELDS, PCI_FIELDS} from './lib/data-scrubber/presets.js'
import {Scrubber} from './lib/data-scrubber/scrubber.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '../package.json')
const isDev = process.env.IS_DEV_ENVIRONMENT === 'true'
const isTelemetryDisabled = process.env.DISABLE_TELEMETRY === 'true'

// Debug instance for telemetry operations
const telemetryDebug = debug('analytics-telemetry')

// Utility function to check if telemetry is enabled
export function isTelemetryEnabled(): boolean {
  if (process.env.DISABLE_TELEMETRY === 'true') return false
  if (process.platform === 'win32' && process.env.ENABLE_WINDOWS_TELEMETRY !== 'true') return false
  if (process.env.IS_HEROKU_TEST_ENV === 'true') return false
  return true
}

// Lazy-loaded state
let isInitialized = false
let isSentryInitialized = false
let version: string | undefined
let cachedToken: string | undefined
let provider: NodeTracerProvider
let processor: BatchSpanProcessor
let sentryClient: ReturnType<typeof Sentry.init> | undefined

export interface TelemetryGlobal extends NodeJS.Global {
  cliTelemetry?: Telemetry
}

interface CLIError extends Error {
  cliRunDuration?: string
}

interface Telemetry {
    cliRunDuration: number,
    command: string,
    commandRunDuration: number,
    exitCode: number,
    exitState: string,
    isVersionOrHelp: boolean
    lifecycleHookCompletion: {
      command_not_found: boolean,
      init: boolean,
      postrun: boolean,
      prerun: boolean,
    },
    os: string,
    version: string,
}

export function computeDuration(cmdStartTime: any) {
  // calculate time duration from start time till now
  const now = new Date()
  const cmdFinishTime = now.getTime()

  return cmdFinishTime - cmdStartTime
}

// Export processor getter for backward compatibility
export function getProcessor() {
  ensureInitialized()
  return processor
}

export function initializeInstrumentation() {
  if (isTelemetryDisabled) {
    return
  }

  telemetryDebug('initializeInstrumentation() called - registering provider with Sentry context')
  ensureInitialized()
  ensureSentryInitialized()
  provider.register({
    contextManager: new Sentry.SentryContextManager(),
    propagator: new SentryPropagator(),
  })
  telemetryDebug('Provider registered with Sentry context manager')
}

export function reportCmdNotFound(config: any) {
  return {
    cliRunDuration: 0,
    command: 'invalid_command',
    commandRunDuration: 0,
    exitCode: 0,
    exitState: 'command_not_found',
    isVersionOrHelp: false,
    lifecycleHookCompletion: {
      command_not_found: true,
      init: true,
      postrun: false,
      prerun: false,
    },
    os: config.platform,
    version: config.version,
  }
}

export async function sendTelemetry(currentTelemetry: any) {
  // send telemetry to honeycomb
  if (isTelemetryDisabled) {
    telemetryDebug('Telemetry disabled, skipping send')
    return
  }

  const telemetry = currentTelemetry

  if (telemetry instanceof Error) {
    telemetryDebug('Sending error to Honeycomb and Sentry: %s', telemetry.message)
    await Promise.all([
      sendToHoneycomb(telemetry),
      sendToSentry(telemetry),
    ])
  } else {
    telemetryDebug('Sending telemetry for command: %s', telemetry.command)
    await sendToHoneycomb(telemetry)
  }
}

export async function sendToHoneycomb(data: CLIError | Telemetry) {
  ensureInitialized()
  try {
    const tracer = opentelemetry.trace.getTracer('heroku-cli', getVersion())
    const span = tracer.startSpan('node_app_execution')
    telemetryDebug('Created span: node_app_execution')

    if (data instanceof Error) {
      telemetryDebug('Honeycomb payload (error): %O', {
        message: data.message,
        name: data.name,
        stack: data.stack,
        code: (data as any).code,
        cliRunDuration: (data as any).cliRunDuration,
      })
      span.recordException(data)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: data.message,
      })
      telemetryDebug('Recorded exception in span: %s', data.message)
    } else {
      telemetryDebug('Honeycomb payload (telemetry): %O', {
        command: data.command,
        os: data.os,
        version: data.version,
        exitCode: data.exitCode,
        exitState: data.exitState,
        cliRunDuration: data.cliRunDuration,
        commandRunDuration: data.commandRunDuration,
        lifecycleHookCompletion: data.lifecycleHookCompletion,
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
    await getProcessor().forceFlush()
    telemetryDebug('Successfully flushed telemetry to Honeycomb')
  } catch (error) {
    telemetryDebug('Error sending telemetry to Honeycomb: %O', error)
    debug('could not send telemetry')
  }
}

export async function sendToSentry(data: CLIError) {
  // Lazy-load Sentry only when we actually need to report an error
  ensureSentryInitialized()
  try {
    telemetryDebug('Sentry payload: %O', {
      message: data.message,
      name: data.name,
      stack: data.stack,
      code: (data as any).code,
      statusCode: (data as any).statusCode,
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

export function setupTelemetry(config: any, opts: any) {
  // Store version from config (eliminates need to read package.json)
  if (!version) {
    version = config.version
  }

  const now = new Date()
  const cmdStartTime = now.getTime()
  const isRegularCmd = Boolean(opts.Command)
  const mcpMode = process.env.HEROKU_MCP_MODE === 'true'
  const mcpServerVersion = process.env.HEROKU_MCP_SERVER_VERSION || 'unknown'

  const irregularTelemetryObject = {
    cliRunDuration: 0,
    command: opts.id,
    commandRunDuration: cmdStartTime,
    exitCode: 0,
    exitState: 'successful',
    isVersionOrHelp: true,
    lifecycleHookCompletion: {
      command_not_found: false,
      init: true,
      postrun: false,
      prerun: false,
    },
    os: config.platform,
    version: `${config.version}${mcpMode ? ` (MCP ${mcpServerVersion})` : ''}`,
  }

  if (isRegularCmd) {
    return {
      ...irregularTelemetryObject,
      command: opts.Command.id,
      isVersionOrHelp: false,
      lifecycleHookCompletion: {
        ...irregularTelemetryObject.lifecycleHookCompletion,
        prerun: true,
      },
    }
  }

  return irregularTelemetryObject
}

function ensureInitialized() {
  if (isInitialized || isTelemetryDisabled) {
    return
  }

  telemetryDebug('Initializing OpenTelemetry...')
  isInitialized = true

  // Skip empty instrumentation registration for performance
  // If we need instrumentations in the future, add them to the array
  // registerInstrumentations({
  //   instrumentations: [],
  // })

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
  const headers = {Authorization: `Bearer ${process.env.IS_HEROKU_TEST_ENV !== 'true' ? getToken() : ''}`}

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

function ensureSentryInitialized() {
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

function getToken() {
  // Cache token to avoid recreating Config/APIClient on every call
  if (cachedToken !== undefined) return cachedToken

  try {
    const config = new Config({root})
    const heroku = new APIClient(config)
    cachedToken = heroku.auth
    return cachedToken
  } catch {
    // If config initialization fails, return empty string
    cachedToken = ''
    return cachedToken
  }
}

function getVersion() {
  return version || 'unknown'
}
