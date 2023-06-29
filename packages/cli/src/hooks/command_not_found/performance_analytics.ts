import {Hook} from '@oclif/core'

import * as telemetry from '../../performance_analytics'

declare const global: telemetry.TelemetryGlobal

const performance_analytics: Hook<'command_not_found'> = async function (options) {
    // console.log('options: ', options)
    // console.log('this.config: ', this.config)
    global.cliTelemetry = telemetry.reportCmdNotFound(this.config)
    // if(global.cliTelemetry) {
    //     const cmdStartTime = global.cliTelemetry.commandRunDuration
    //     global.cliTelemetry.commandRunDuration = telemetry.computeDuration(cmdStartTime)
    // }
    console.log('cliTelemetry in command_not_found: ', global.cliTelemetry)

  // const analytics = new Analytics(this.config)
  // await analytics.record(options)
}

export default performance_analytics
