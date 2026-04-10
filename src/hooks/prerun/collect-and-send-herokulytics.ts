import {Hook} from '@oclif/core/hooks'

const analytics: Hook<'prerun'> = async function (options) {
  const {isTelemetryEnabled, getTelemetryDisabledReason, spawnTelemetryWorker, telemetryDebug} = await import('../../lib/analytics-telemetry/telemetry-utils.js')

  // Use the consolidated telemetry check
  if (!isTelemetryEnabled()) {
    const reason = getTelemetryDisabledReason()
    telemetryDebug('Telemetry disabled (%s): skipping prerun hook, not sending Herokulytics for command: %s', reason, options.Command.id)
    return
  }

  telemetryDebug('Telemetry enabled: prerun hook spawning worker to send Herokulytics for command: %s', options.Command.id)
  const {telemetryManager} = await import('../../lib/analytics-telemetry/telemetry-manager.js')
  const globalAny = global as any

  // Only setup telemetry if not already initialized (avoid overwriting init hook data)
  if (globalAny.cliTelemetry) {
    // Update existing telemetry for regular commands
    globalAny.cliTelemetry.command = options.Command.id
    globalAny.cliTelemetry.isVersionOrHelp = false
    globalAny.cliTelemetry.lifecycleHookCompletion.prerun = true
  } else {
    globalAny.cliTelemetry = telemetryManager.setupTelemetry(this.config, options)
  }

  // Spawn background process to send herokulytics without blocking
  // Serialize only the needed parts of Command (id and plugin info)
  const herokulyticsData = {
    _type: 'herokulytics' as const,
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
