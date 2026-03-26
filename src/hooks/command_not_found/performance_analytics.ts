import {Hook} from '@oclif/core/hooks'

const performance_analytics: Hook<'command_not_found'> = async function () {
  const telemetry = await import('../../lib/analytics-telemetry/global-telemetry.js')

  // Use the consolidated telemetry check
  if (!telemetry.isTelemetryEnabled()) {
    return
  }

  (global as any).cliTelemetry = telemetry.reportCmdNotFound(this.config)
}

export default performance_analytics
