import Rollbar from 'rollbar'
import {HoneycombSDK} from '@honeycombio/opentelemetry-node'
import {getNodeAutoInstrumentations} from '@opentelemetry/auto-instrumentations-node'
import 'dotenv/config'

const debug = require('debug')('global_telemetry')
const rollbar = new Rollbar({
  accessToken: '41f8730238814af69c248e2f7ca59ff2',
  captureUncaught: true,
  captureUnhandledRejections: true,
})

interface Telemetry {
    command: string,
    os: string,
    version: string,
    exitCode: number,
    exitState: string[],
    cliRunDuration: number,
    commandRunDuration: number,
    lifecycleHookCompletion: {
      init: boolean,
      prerun: boolean,
      postrun: boolean,
      command_not_found: boolean,
    }
}

export interface TelemetryGlobal extends NodeJS.Global {
  cliTelemetry?: Telemetry
}

export function initializeHoneycombAutoInstrumentations() {
  const sdk = new HoneycombSDK({
    apiKey: process.env.HONEYCOMB_API_KEY,
    serviceName: process.env.OTEL_SERVICE_NAME,
    instrumentations: [getNodeAutoInstrumentations({
      // we recommend disabling fs autoinstrumentation since it can be noisy
      // and expensive during startup
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    })],
    dataset: process.env.TEST_DEV_DATASET,
  })

  sdk.start()
}

export function setupTelemetry(config: any, opts: any) {
  const now = new Date()
  const cmdStartTime = now.getTime()
  return {
    command: opts.Command.id,
    os: config.platform,
    version: config.version,
    exitCode: 0,
    exitState: [''],
    cliRunDuration: 0,
    commandRunDuration: cmdStartTime,
    lifecycleHookCompletion: {
      init: true,
      prerun: true,
      postrun: false,
      command_not_found: false,
    },
  }
}

export function computeDuration(cmdStartTime: any) {
  // calculate time duration from start time till now
  const now = new Date()
  const cmdFinishTime = now.getTime()

  return cmdFinishTime - cmdStartTime
}

export function reportCmdNotFound(config: any) {
  return {
    command: '',
    os: config.platform,
    version: config.version,
    exitCode: 0,
    exitState: ['command_not_found'],
    cliRunDuration: 0,
    commandRunDuration: 0,
    lifecycleHookCompletion: {
      init: true,
      prerun: false,
      postrun: false,
      command_not_found: true,
    },
  }
}

export async function sendTelemetry(currentTelemetry: any) {
  // send telemetry to honeycomb and rollbar
  let telemetry = currentTelemetry

  if (telemetry instanceof Error) {
    telemetry = {error_message: telemetry.message, error_stack: telemetry.stack}
    telemetry.cliRunDuration = currentTelemetry.cliRunDuration
    await sendToRollbar(telemetry)
  }

  await sendToHoneycomb(telemetry)
}

export async function sendToHoneycomb(data: any) {
  try {
    // send telemetry to backboard
  } catch {
    debug('could not send telemetry')
  }
}

export async function sendToRollbar(data: any) {
  try {
    // send data to rollbar
    rollbar.error('Failed to complete execution', data, () => {
      process.exit(1)
    })
  } catch {
    debug('could not send error report')
    process.exit(1)
  }
}

export async function reportSuccessful(telemetryData: any) {
  // send available telemetry
  await sendTelemetry(telemetryData)
}

export async function reportUnsuccessful(error: Error) {
  // send available telemetry
  await sendTelemetry(error)
}
