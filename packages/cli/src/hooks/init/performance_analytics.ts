import {Hook} from '@oclif/core'

import * as telemetry from '../../global_telemetry'

declare const global: telemetry.TelemetryGlobal

const performance_analytics: Hook<'init'> = async function (options) {
  global.cliTelemetry = telemetry.setupTelemetry(this.config, options)
}

export default performance_analytics
