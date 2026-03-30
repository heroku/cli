import {Hook} from '@oclif/core/hooks'

import Analytics from '../../analytics.js'

const analytics: Hook<'prerun'> = async function (options) {
  const {isTelemetryEnabled} = await import('../../lib/analytics-telemetry/telemetry-utils.js')
  const {setupTelemetry} = await import('../../lib/analytics-telemetry/global-telemetry.js')

  // Use the consolidated telemetry check
  if (!isTelemetryEnabled()) {
    return
  }

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

  const analyticsInstance = new Analytics(this.config)
  Reflect.set(globalThis, 'recordPromise', analyticsInstance.record(options))
}

export default analytics
