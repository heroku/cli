import {Hook} from '@oclif/core'

import Analytics from '../../analytics'
import * as telemetry from '../../performance_analytics'

declare const global: telemetry.TelemetryGlobal

const analytics: Hook<'prerun'> = async function (options) {
  global.cliTelemetry = telemetry.setupTelemetry(this.config, options)
  console.log('cliTelemetry: ', global.cliTelemetry)

  // const analytics = new Analytics(this.config)
  // await analytics.record(options)
}

export default analytics
