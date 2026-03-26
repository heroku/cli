import {Hook} from '@oclif/core/hooks'

const performance_analytics: Hook<'postrun'> = async function () {
  const globalAny = global as any

  if (!globalAny.cliTelemetry) {
    return
  }

  const telemetry = await import('../../lib/analytics-telemetry/global-telemetry.js')

  // Use the consolidated telemetry check
  if (!telemetry.isTelemetryEnabled()) {
    return
  }

  const cmdStartTime = globalAny.cliTelemetry.commandRunDuration
  globalAny.cliTelemetry.commandRunDuration = telemetry.computeDuration(cmdStartTime)
  globalAny.cliTelemetry.lifecycleHookCompletion.postrun = true
  await Reflect.get(globalThis, 'recordPromise')
}

export default performance_analytics
