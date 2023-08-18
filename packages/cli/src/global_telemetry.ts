import 'dotenv/config'
import * as Rollbar from 'rollbar'
import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import opentelemetry, {SpanStatusCode} from '@opentelemetry/api'
const {Resource} = require('@opentelemetry/resources')
const {SemanticResourceAttributes} = require('@opentelemetry/semantic-conventions')
const {registerInstrumentations} = require('@opentelemetry/instrumentation')
const {NodeTracerProvider} = require('@opentelemetry/sdk-trace-node')
const {BatchSpanProcessor} = require('@opentelemetry/sdk-trace-base')
const {OTLPTraceExporter} = require('@opentelemetry/exporter-trace-otlp-http')
const path = require('path')
const {version} = require('../package.json')

const root = path.resolve(__dirname, '../package.json')
const isDev = process.env.IS_DEV_ENVIRONMENT === 'true'
const config = new Config({root})
const heroku = new APIClient(config)
const token = heroku.auth

const debug = require('debug')('global_telemetry')

const rollbar = new Rollbar({
  accessToken: '41f8730238814af69c248e2f7ca59ff2',
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: isDev ? 'development' : 'production',
  codeVersion: version,
})

registerInstrumentations({
  instrumentations: [],
})

const resource = Resource
  .default()
  .merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'heroku-cli',
      [SemanticResourceAttributes.SERVICE_VERSION]: version,
    }),
  )

const provider = new NodeTracerProvider({
  resource,
})

const headers = {Authorization: `Bearer ${token}`}

const exporter = new OTLPTraceExporter({
  url: isDev ? 'https://backboard-staging.herokuapp.com/otel/v1/traces' : 'https://backboard.heroku.com/otel/v1/traces',
  headers,
  compression: 'none',
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
  provider.register()
}

export function setupTelemetry(config: any, opts: any) {
  const now = new Date()
  const cmdStartTime = now.getTime()
  const isRegularCmd = Boolean(opts.Command)

  const irregularTelemetryObject = {
    command: opts.id,
    os: config.platform,
    version: config.version,
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

export async function sendTelemetry(currentTelemetry: any,  rollbarCb?: () => void) {
  // send telemetry to honeycomb and rollbar
  const telemetry = currentTelemetry

  if (telemetry instanceof Error) {
    await Promise.all([
      sendToRollbar(telemetry, rollbarCb),
      sendToHoneycomb(telemetry),
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
    processor.forceFlush()
  } catch {
    debug('could not send telemetry')
  }
}

export async function sendToRollbar(data: CLIError, rollbarCb?: () => void) {
  // Make this awaitable so we can wait for it to finish before exiting
  let promiseResolve
  const rollbarPromise = new Promise((resolve, reject) => {
    promiseResolve = () => {
      if (rollbarCb) {
        try {
          rollbarCb()
        } catch (error: any) {
          reject(error)
        }
      }

      resolve(null)
    }
  })

  const rollbarError = {name: data.name, message: data.message, stack: data.stack, cli_run_duration: data.cliRunDuration}
  try {
    // send data to rollbar
    rollbar.error('Failed to complete execution', rollbarError, promiseResolve)
  } catch {
    debug('Could not send error report')
    return Promise.reject()
  }

  return rollbarPromise
}
