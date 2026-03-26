import {Hook} from '@oclif/core/hooks'

const performance_analytics: Hook<'init'> = async function (options) {
  const telemetry = await import('../../global_telemetry.js')

  // Use the consolidated telemetry check
  if (!telemetry.isTelemetryEnabled()) {
    return
  }

  (global as any).cliTelemetry = telemetry.setupTelemetry(this.config, options)
}

export default performance_analytics
