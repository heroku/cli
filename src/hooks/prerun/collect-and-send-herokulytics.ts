import {Hook} from '@oclif/core/hooks'

const analytics: Hook<'prerun'> = async function (options) {
  const {isTelemetryEnabled, spawnTelemetryWorker} = await import('../../lib/analytics-telemetry/telemetry-utils.js')

  // Use the consolidated telemetry check
  if (!isTelemetryEnabled()) {
    return
  }

  const {setupTelemetry} = await import('../../lib/analytics-telemetry/global-telemetry.js')
  const globalAny = global as any

  // Only setup telemetry if not already initialized (avoid overwriting init hook data)
  if (globalAny.cliTelemetry) {
    // Update existing telemetry for regular commands
    globalAny.cliTelemetry.command = options.Command.id
    globalAny.cliTelemetry.isVersionOrHelp = false
    globalAny.cliTelemetry.lifecycleHookCompletion.prerun = true
  } else {
    globalAny.cliTelemetry = setupTelemetry(this.config, options)
  }

  // Spawn background process to send herokulytics without blocking
  // Serialize only the needed parts of Command (id and plugin info)
  const herokulyticsData = {
    argv: options.argv,
    Command: {
      id: options.Command.id,
      plugin: options.Command.plugin ? {
        name: options.Command.plugin.name,
        version: options.Command.plugin.version,
      } : undefined,
    },
  }

  spawnTelemetryWorker(herokulyticsData)
}

export default analytics
