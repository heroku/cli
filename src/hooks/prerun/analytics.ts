import {Hook} from '@oclif/core'

import Analytics from '../../analytics.js'

const analytics: Hook<'prerun'> = async function (options) {
  if (process.env.IS_HEROKU_TEST_ENV === 'true') {
    return
  }

  // Skip analytics on Windows for performance (unless explicitly enabled)
  if (process.platform === 'win32' && process.env.ENABLE_WINDOWS_TELEMETRY !== 'true') {
    return
  }

  const telemetry = await import('../../global_telemetry.js')
  const globalAny = global as any
  globalAny.cliTelemetry = telemetry.setupTelemetry(this.config, options)
  const analyticsInstance = new Analytics(this.config)
  Reflect.set(globalThis, 'recordPromise', analyticsInstance.record(options))
}

export default analytics
