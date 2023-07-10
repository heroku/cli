import Rollbar from 'rollbar'
const rollbar = new Rollbar({
  accessToken: '41f8730238814af69c248e2f7ca59ff2',
  captureUncaught: true,
  captureUnhandledRejections: true,
  verbose: true,
  sendConfig: true,
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

  //   console.log('available telemetry here: ', telemetry)
  await sendToHoneycomb(telemetry)
}

export async function sendToHoneycomb(data: any) {
  // send captured cli telemetry to honeycomb via open telemetry client
  try {
    // send telemetry to honeycomb
  } catch {
    console.log('could not send telemetry')
  }
}

export async function sendToRollbar(data: any) {
  // let isReportSent = false
  // rollbar.log('cli test!', () => {
  //   isReportSent = true
  // })

  // if (!isReportSent) {
  //   console.log('could not send error report')
  // }

  // try {
  //   // send data to rollbar
  //   rollbar.log('cli test!', () => {
  //     console.log('WE SENT TO ROLLBAR')
  //   })
  //   console.log('sendToRollbar')
  // } catch {
  //   console.log('could not send error report')
  // }
}

export async function reportSuccessful(telemetryData: any) {
  // send available telemetry
  // rollbar.log('THIS WORKED')
  await sendTelemetry(telemetryData)
}

export async function reportUnsuccessful(error: Error) {
  // send available telemetry
  await sendTelemetry(error)
}
