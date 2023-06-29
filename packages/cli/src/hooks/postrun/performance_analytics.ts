import {Hook} from '@oclif/core'

import * as telemetry from '../../performance_analytics'

declare const global: telemetry.TelemetryGlobal

const performance_analytics: Hook<'postrun'> = async function (options) {
    if(global.cliTelemetry) {
        const cmdStartTime = global.cliTelemetry.commandRunDuration
        global.cliTelemetry.commandRunDuration = telemetry.computeDuration(cmdStartTime)
    }
    console.log('cliTelemetry in postrun: ', global.cliTelemetry)

  // const analytics = new Analytics(this.config)
  // await analytics.record(options)
}

export default performance_analytics
