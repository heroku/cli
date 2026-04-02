import {Hook} from '@oclif/core/hooks'

const performance_analytics: Hook<'init'> = async function (options) {
  const {isTelemetryEnabled} = await import('../../lib/analytics-telemetry/telemetry-utils.js')

  // Use the consolidated telemetry check
  if (!isTelemetryEnabled()) {
    return
  }

  const {telemetryManager} = await import('../../lib/analytics-telemetry/telemetry-manager.js')
  const globalAny = global as any
  globalAny.cliTelemetry = telemetryManager.setupTelemetry(this.config, options)
}

export default performance_analytics
