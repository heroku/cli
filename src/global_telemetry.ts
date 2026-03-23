import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core/config'
import opentelemetry, {SpanStatusCode} from '@opentelemetry/api'
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http'
import {registerInstrumentations} from '@opentelemetry/instrumentation'
import {Resource} from '@opentelemetry/resources'
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-base'
import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node'
import {SemanticResourceAttributes} from '@opentelemetry/semantic-conventions'
import * as Sentry from '@sentry/node'
import {
  SentryPropagator,
  SentrySampler,
} from '@sentry/opentelemetry'
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

// Lazy-loaded state
let isInitialized = false
let version: string | undefined
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

  ensureInitialized()
  provider.register({
    contextManager: new Sentry.SentryContextManager(),
    propagator: new SentryPropagator(),
  })
  // provider.register()
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
    return
  }

  const telemetry = currentTelemetry

  if (telemetry instanceof Error) {
    await Promise.all([
      sendToHoneycomb(telemetry),
      sendToSentry(telemetry),
    ])
  } else {
    await sendToHoneycomb(telemetry)
  }
}

export async function sendToHoneycomb(data: CLIError | Telemetry) {
  ensureInitialized()
  try {
    const tracer = opentelemetry.trace.getTracer('heroku-cli', getVersion())
    const span = tracer.startSpan('node_app_execution')

    if (data instanceof Error) {
      span.recordException(data)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: data.message,
      })
    } else {
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
    }

    span.end()
    await getProcessor().forceFlush()
  } catch {
    debug('could not send telemetry')
  }
}

export async function sendToSentry(data: CLIError) {
  ensureInitialized()
  try {
    Sentry.captureException(data)
    // ensures all events are sent to Sentry before exiting.
    await Sentry.flush()
  } catch {
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

  isInitialized = true

  registerInstrumentations({
    instrumentations: [],
  })

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

  const resource = Resource
    .default()
    .merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'heroku-cli',
        [SemanticResourceAttributes.SERVICE_VERSION]: undefined, // will be set later
      }),
    )

  provider = new NodeTracerProvider({
    resource,
    sampler: sentryClient ? new SentrySampler(sentryClient) : undefined,
  })

  // eslint-disable-next-line no-negated-condition, unicorn/no-negated-condition
  const headers = {Authorization: `Bearer ${process.env.IS_HEROKU_TEST_ENV !== 'true' ? getToken() : ''}`}

  const exporter = new OTLPTraceExporter({
    compression: undefined,
    headers,
    url: isDev ? 'https://backboard.staging.herokudev.com/otel/v1/traces' : 'https://backboard.heroku.com/otel/v1/traces',
  })

  processor = new BatchSpanProcessor(exporter)
  provider.addSpanProcessor(processor)
}

function getToken() {
  const config = new Config({root})
  const heroku = new APIClient(config)
  return heroku.auth
}

function getVersion() {
  return version || 'unknown'
}
