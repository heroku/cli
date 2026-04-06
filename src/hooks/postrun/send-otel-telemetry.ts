import {Hook} from '@oclif/core/hooks'

const performance_analytics: Hook<'postrun'> = async function () {
  const globalAny = global as any

  if (!globalAny.cliTelemetry) {
    return
  }

  const {computeDuration, isTelemetryEnabled, spawnTelemetryWorker} = await import('../../lib/analytics-telemetry/telemetry-utils.js')

  // Use the consolidated telemetry check
  if (!isTelemetryEnabled()) {
    return
  }

  const cmdStartTime = globalAny.cliTelemetry.commandRunDuration
  globalAny.cliTelemetry.commandRunDuration = computeDuration(cmdStartTime)
  globalAny.cliTelemetry.lifecycleHookCompletion.postrun = true

  // Spawn background process to send telemetry without blocking
  spawnTelemetryWorker(globalAny.cliTelemetry)
}

export default performance_analytics
