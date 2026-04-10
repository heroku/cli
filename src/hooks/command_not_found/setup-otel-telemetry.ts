import {Hook} from '@oclif/core/hooks'

const performance_analytics: Hook<'command_not_found'> = async function () {
  const {isTelemetryEnabled, getTelemetryDisabledReason, telemetryDebug} = await import('../../lib/analytics-telemetry/telemetry-utils.js')

  // Use the consolidated telemetry check
  if (!isTelemetryEnabled()) {
    const reason = getTelemetryDisabledReason()
    telemetryDebug('Telemetry disabled (%s): skipping command_not_found hook, not setting up telemetry for invalid command', reason)
    return
  }

  telemetryDebug('Telemetry enabled: command_not_found hook setting up telemetry for invalid command')
  const {telemetryManager} = await import('../../lib/analytics-telemetry/telemetry-manager.js')
  const globalAny = global as any
  globalAny.cliTelemetry = telemetryManager.reportCmdNotFound(this.config)
}

export default performance_analytics
