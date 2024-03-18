import {Hook} from '@oclif/core'

import Analytics from '../../analytics'
import * as telemetry from '../../global_telemetry'

declare const global: telemetry.TelemetryGlobal

const analytics: Hook<'prerun'> = async function (options) {
  if (process.env.IS_HEROKU_TEST_ENV === 'true') {
    return
  }

  global.cliTelemetry = telemetry.setupTelemetry(this.config, options)
  const analytics = new Analytics(this.config)
  await analytics.record(options)
}

export default analytics
