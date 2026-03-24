import {Hook} from '@oclif/core'

const performance_analytics: Hook<'postrun'> = async function () {
  if (process.env.IS_HEROKU_TEST_ENV === 'true' || !(global as any).cliTelemetry) {
    return
  }

  // Skip analytics on Windows for performance (unless explicitly enabled)
  if (process.platform === 'win32' && process.env.ENABLE_WINDOWS_TELEMETRY !== 'true') {
    return
  }

  const telemetry = await import('../../global_telemetry.js')
  const globalAny = global as any
  const cmdStartTime = globalAny.cliTelemetry.commandRunDuration
  globalAny.cliTelemetry.commandRunDuration = telemetry.computeDuration(cmdStartTime)
  globalAny.cliTelemetry.lifecycleHookCompletion.postrun = true
  await Reflect.get(globalThis, 'recordPromise')
}

export default performance_analytics
