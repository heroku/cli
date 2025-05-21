import {Hook} from '@oclif/core'

import * as telemetry from '../../global_telemetry.js'

declare const global: telemetry.TelemetryGlobal

const performance_analytics: Hook<'command_not_found'> = async function () {
  global.cliTelemetry = telemetry.reportCmdNotFound(this.config)
}

export default performance_analytics
