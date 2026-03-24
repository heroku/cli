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
  ;(global as any).cliTelemetry = telemetry.setupTelemetry(this.config, options)
  const analytics = new Analytics(this.config)
  Reflect.set(globalThis, 'recordPromise', analytics.record(options))
}

export default analytics
