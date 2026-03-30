import {Hook} from '@oclif/core/hooks'

const performance_analytics: Hook<'init'> = async function (options) {
  const {isTelemetryEnabled} = await import('../../lib/analytics-telemetry/telemetry-utils.js')
  const {setupTelemetry} = await import('../../lib/analytics-telemetry/global-telemetry.js')

  // Use the consolidated telemetry check
  if (!isTelemetryEnabled()) {
    return
  }

  (global as any).cliTelemetry = setupTelemetry(this.config, options)
}

export default performance_analytics
