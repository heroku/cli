import {Hook} from '@oclif/core/hooks'

const performance_analytics: Hook<'init'> = async function (options) {
  // Skip telemetry on Windows for performance (unless explicitly enabled)
  if (process.platform === 'win32' && process.env.ENABLE_WINDOWS_TELEMETRY !== 'true') {
    return
  }

  const telemetry = await import('../../global_telemetry.js');
  (global as any).cliTelemetry = telemetry.setupTelemetry(this.config, options)
}

export default performance_analytics
