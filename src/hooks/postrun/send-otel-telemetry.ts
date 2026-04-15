import {Hook} from '@oclif/core/hooks'

const performance_analytics: Hook<'postrun'> = async function () {
  const globalAny = globalThis as any

  if (!globalAny.cliTelemetry) {
    return
  }

  const {computeDuration, getTelemetryDisabledReason, isTelemetryEnabled, spawnTelemetryWorker, telemetryDebug} = await import('../../lib/analytics-telemetry/telemetry-utils.js')

  // Use the consolidated telemetry check
  if (!isTelemetryEnabled()) {
    const reason = getTelemetryDisabledReason()
    telemetryDebug('Telemetry disabled (%s): skipping postrun hook, not sending telemetry for command: %s', reason, globalAny.cliTelemetry.command)
    return
  }

  telemetryDebug('Telemetry enabled: postrun hook spawning worker to send telemetry for command: %s', globalAny.cliTelemetry.command)
  const cmdStartTime = globalAny.cliTelemetry.commandRunDuration
  globalAny.cliTelemetry.commandRunDuration = computeDuration(cmdStartTime)
  globalAny.cliTelemetry.lifecycleHookCompletion.postrun = true

  // Spawn background process to send telemetry without blocking
  spawnTelemetryWorker(globalAny.cliTelemetry)

  // Mark telemetry as sent to prevent duplicate sends from beforeExit handler
  globalAny.telemetrySent = true
}

export default performance_analytics
