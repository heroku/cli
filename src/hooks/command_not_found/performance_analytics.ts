import {Hook} from '@oclif/core'

const performance_analytics: Hook<'command_not_found'> = async function () {
  // Skip telemetry on Windows for performance (unless explicitly enabled)
  if (process.platform === 'win32' && process.env.ENABLE_WINDOWS_TELEMETRY !== 'true') {
    return
  }

  const telemetry = await import('../../global_telemetry.js')
  ;(global as any).cliTelemetry = telemetry.reportCmdNotFound(this.config)
}

export default performance_analytics
