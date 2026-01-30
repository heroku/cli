import debug from 'debug'
import {promises as fs} from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '../package.json')
const isDev = process.env.IS_DEV_ENVIRONMENT === 'true'
const isTelemetryDisabled = process.env.DISABLE_TELEMETRY === 'true'
const isTestEnv = process.env.IS_HEROKU_TEST_ENV === 'true'

async function getVersion() {
  const pkg = JSON.parse(await fs.readFile(root, 'utf8'))
  return pkg.version
}

const version = await getVersion()

interface Telemetry {
    cliRunDuration: number,
    command: string,
    commandRunDuration: number,
    exitCode: number,
    exitState: string,
    isVersionOrHelp: boolean,
    lifecycleHookCompletion: {
      command_not_found: boolean,
      init: boolean,
      postrun: boolean,
      prerun: boolean,
    },
    os: string,
    version: string,
}

export interface TelemetryGlobal extends NodeJS.Global {
  cliTelemetry?: Telemetry
}

interface CLIError extends Error {
  cliRunDuration?: string
}

// No-op span processor for test environments to avoid network calls and timers
class NoOpSpanProcessor {
  forceFlush(): Promise<void> {
    return Promise.resolve()
  }

  onEnd(): void {}
  onStart(): void {}
  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}

// Lazy-loaded telemetry infrastructure (only initialized in non-test environments)
let _processor: any
let _provider: any
let _sentryClient: any
let _opentelemetry: any
let _Sentry: any
let _initialized = false

async function initializeTelemetryInfrastructure() {
  if (_initialized || isTestEnv) return
  _initialized = true

  const {APIClient} = await import('@heroku-cli/command')
  const {Config} = await import('@oclif/core')
  const otel = await import('@opentelemetry/api')
  const Sentry = await import('@sentry/node')
  const {SentrySampler} = await import('@sentry/opentelemetry')
  const {GDPR_FIELDS, HEROKU_FIELDS, PCI_FIELDS} = await import('./lib/data-scrubber/presets.js')
  const {Scrubber} = await import('./lib/data-scrubber/scrubber.js')
  const {PII_PATTERNS} = await import('./lib/data-scrubber/patterns.js')
  const {Resource} = await import('@opentelemetry/resources')
  const {SemanticResourceAttributes} = await import('@opentelemetry/semantic-conventions')
  const {registerInstrumentations} = await import('@opentelemetry/instrumentation')
  const {NodeTracerProvider} = await import('@opentelemetry/sdk-trace-node')
  const {BatchSpanProcessor} = await import('@opentelemetry/sdk-trace-base')
  const {OTLPTraceExporter} = await import('@opentelemetry/exporter-trace-otlp-http')

  _opentelemetry = otel.default
  _Sentry = Sentry

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

  _sentryClient = Sentry.init({
    beforeSend(event: any) {
      return scrubber.scrub(event).data
    },
    dsn: 'https://76530569188e7ee2961373f37951d916@o4508609692368896.ingest.us.sentry.io/4508767754846208',
    environment: isDev ? 'development' : 'production',
    release: version,
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

  _provider = new NodeTracerProvider({
    resource,
    sampler: _sentryClient ? new SentrySampler(_sentryClient) : undefined,
  })

  const headers = {Authorization: `Bearer ${getToken()}`}

  const exporter = new OTLPTraceExporter({
    compression: undefined,
    headers,
    url: isDev ? 'https://backboard.staging.herokudev.com/otel/v1/traces' : 'https://backboard.heroku.com/otel/v1/traces',
  })
  _processor = new BatchSpanProcessor(exporter)
  _provider.addSpanProcessor(_processor)
}

// Export a processor that lazily initializes or returns no-op
export const processor = isTestEnv ? new NoOpSpanProcessor() : {
  async forceFlush(): Promise<void> {
    await initializeTelemetryInfrastructure()
    if (_processor) {
      return _processor.forceFlush()
    }
  },
  onEnd(): void {},
  onStart(): void {},
  async shutdown(): Promise<void> {
    if (_processor) {
      return _processor.shutdown()
    }
  },
}

export async function initializeInstrumentation() {
  if (isTestEnv) return

  await initializeTelemetryInfrastructure()
  if (_provider && _sentryClient) {
    const {SentryPropagator} = await import('@sentry/opentelemetry')
    const Sentry = await import('@sentry/node')
    _provider.register({
      contextManager: new Sentry.SentryContextManager(),
      propagator: new SentryPropagator(),
    })
  }
}

export function setupTelemetry(config: any, opts: any) {
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

export function computeDuration(cmdStartTime: any) {
  // calculate time duration from start time till now
  const now = new Date()
  const cmdFinishTime = now.getTime()

  return cmdFinishTime - cmdStartTime
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
  if (isTelemetryDisabled || isTestEnv) {
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
  if (isTestEnv) return

  try {
    await initializeTelemetryInfrastructure()
    if (!_opentelemetry) return

    const tracer = _opentelemetry.trace.getTracer('heroku-cli', version)
    const span = tracer.startSpan('node_app_execution')

    if (data instanceof Error) {
      const {SpanStatusCode} = await import('@opentelemetry/api')
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
    if (_processor) {
      await _processor.forceFlush()
    }
  } catch {
    debug('could not send telemetry')
  }
}

export async function sendToSentry(data: CLIError) {
  if (isTestEnv) return

  try {
    await initializeTelemetryInfrastructure()
    if (!_Sentry) return

    _Sentry.captureException(data)
    // ensures all events are sent to Sentry before exiting.
    await _Sentry.flush()
  } catch {
    debug('Could not send error report')
  }
}
