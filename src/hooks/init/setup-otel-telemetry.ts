import {Hook} from '@oclif/core/hooks'

const performance_analytics: Hook<'init'> = async function (options) {
  const {getTelemetryDisabledReason, isTelemetryEnabled, telemetryDebug} = await import('../../lib/analytics-telemetry/telemetry-utils.js')

  // Use the consolidated telemetry check
  if (!isTelemetryEnabled()) {
    const reason = getTelemetryDisabledReason()
    telemetryDebug('Telemetry disabled (%s): skipping init hook, not setting up telemetry object', reason)
    return
  }

  telemetryDebug('Telemetry enabled: init hook setting up telemetry object for command')
  const {telemetryManager} = await import('../../lib/analytics-telemetry/telemetry-manager.js')
  const globalAny = globalThis as any
  globalAny.cliTelemetry = telemetryManager.setupTelemetry(this.config, options)
}

export default performance_analytics
