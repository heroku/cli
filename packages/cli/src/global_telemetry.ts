import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import opentelemetry, {SpanStatusCode} from '@opentelemetry/api'
import * as Sentry from '@sentry/node'
import {
  SentryPropagator,
  SentrySampler,
} from '@sentry/opentelemetry'
import {GDPR_FIELDS, HEROKU_FIELDS, PCI_FIELDS} from './lib/data-scrubber/presets.js'
import {Scrubber} from './lib/data-scrubber/scrubber.js'
import {PII_PATTERNS} from './lib/data-scrubber/patterns.js'

import {Resource} from '@opentelemetry/resources'
import {SemanticResourceAttributes} from '@opentelemetry/semantic-conventions'
import {registerInstrumentations} from '@opentelemetry/instrumentation'
import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node'
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-base'
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http'
import path from 'path'
import {promises as fs} from 'fs'
import {fileURLToPath} from 'url'
import debug from 'debug'

// @ts-expect-error - TS requires import attributes for JSON in NodeNext, but our version doesn't support them.
import pkg from '../package.json'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '../package.json')
const isDev = process.env.IS_DEV_ENVIRONMENT === 'true'
const isTelemetryDisabled = process.env.DISABLE_TELEMETRY === 'true'
const version = pkg.version

function getToken() {
  const config = new Config({root})
  const heroku = new APIClient(config)
  return heroku.auth
}

registerInstrumentations({
  instrumentations: [],
})

const scrubber = new Scrubber({
  fields: [...HEROKU_FIELDS, ...GDPR_FIELDS, ...PCI_FIELDS],
  patterns: [...PII_PATTERNS],
})

const sentryClient = Sentry.init({
  dsn: 'https://76530569188e7ee2961373f37951d916@o4508609692368896.ingest.us.sentry.io/4508767754846208',
  environment: isDev ? 'development' : 'production',
  release: version,
  tracesSampleRate: 1, // needed to ensure we send OTEL data to Honeycomb
  beforeSend(event) {
    return scrubber.scrub(event).data
  },
  skipOpenTelemetrySetup: true, // needed since we have our own OTEL setup
})

const resource = Resource
  .default()
  .merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'heroku-cli',
      [SemanticResourceAttributes.SERVICE_VERSION]: undefined, // will be set later
    }),
  )

const provider = new NodeTracerProvider({
  resource,
  sampler: sentryClient ? new SentrySampler(sentryClient) : undefined,
})

// eslint-disable-next-line no-negated-condition, unicorn/no-negated-condition
const headers = {Authorization: `Bearer ${process.env.IS_HEROKU_TEST_ENV !== 'true' ? getToken() : ''}`}

const exporter = new OTLPTraceExporter({
  url: isDev ? 'https://backboard.staging.herokudev.com/otel/v1/traces' : 'https://backboard.heroku.com/otel/v1/traces',
  headers,
  compression: undefined,
})
export const processor = new BatchSpanProcessor(exporter)
provider.addSpanProcessor(processor)

interface Telemetry {
    command: string,
    os: string,
    version: string,
    exitCode: number,
    exitState: string,
    cliRunDuration: number,
    commandRunDuration: number,
    lifecycleHookCompletion: {
      init: boolean,
      prerun: boolean,
      postrun: boolean,
      command_not_found: boolean,
    },
    isVersionOrHelp: boolean
}

export interface TelemetryGlobal extends NodeJS.Global {
  cliTelemetry?: Telemetry
}

interface CLIError extends Error {
  cliRunDuration?: string
}

export function initializeInstrumentation() {
  provider.register({
    propagator: new SentryPropagator(),
    contextManager: new Sentry.SentryContextManager(),
  })
  // provider.register()
}

export function setupTelemetry(config: any, opts: any) {
  const now = new Date()
  const cmdStartTime = now.getTime()
  const isRegularCmd = Boolean(opts.Command)
  const mcpMode = process.env.HEROKU_MCP_MODE === 'true'
  const mcpServerVersion = process.env.HEROKU_MCP_SERVER_VERSION || 'unknown'

  const irregularTelemetryObject = {
    command: opts.id,
    os: config.platform,
    version: `${config.version}${mcpMode ? ` (MCP ${mcpServerVersion})` : ''}`,
    exitCode: 0,
    exitState: 'successful',
    cliRunDuration: 0,
    commandRunDuration: cmdStartTime,
    lifecycleHookCompletion: {
      init: true,
      prerun: false,
      postrun: false,
      command_not_found: false,
    },
    isVersionOrHelp: true,
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

export function computeDuration(cmdStartTime: any) {
  // calculate time duration from start time till now
  const now = new Date()
  const cmdFinishTime = now.getTime()

  return cmdFinishTime - cmdStartTime
}

export function reportCmdNotFound(config: any) {
  return {
    command: 'invalid_command',
    os: config.platform,
    version: config.version,
    exitCode: 0,
    exitState: 'command_not_found',
    cliRunDuration: 0,
    commandRunDuration: 0,
    lifecycleHookCompletion: {
      init: true,
      prerun: false,
      postrun: false,
      command_not_found: true,
    },
    isVersionOrHelp: false,
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

export async function sendToHoneycomb(data: Telemetry | CLIError) {
  try {
    const tracer = opentelemetry.trace.getTracer('heroku-cli', version)
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
    await processor.forceFlush()
  } catch {
    debug('could not send telemetry')
  }
}

export async function sendToSentry(data: CLIError) {
  try {
    Sentry.captureException(data)
    // ensures all events are sent to Sentry before exiting.
    await Sentry.flush()
  } catch {
    debug('Could not send error report')
  }
}
