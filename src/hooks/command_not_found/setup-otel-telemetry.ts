import {Hook} from '@oclif/core/hooks'

const performance_analytics: Hook<'command_not_found'> = async function () {
  const {isTelemetryEnabled} = await import('../../lib/analytics-telemetry/telemetry-utils.js')

  // Use the consolidated telemetry check
  if (!isTelemetryEnabled()) {
    return
  }

  const {reportCmdNotFound} = await import('../../lib/analytics-telemetry/global-telemetry.js')
  const globalAny = global as any
  globalAny.cliTelemetry = reportCmdNotFound(this.config)
}

export default performance_analytics
