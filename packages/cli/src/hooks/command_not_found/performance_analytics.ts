import {Hook} from '@oclif/core'

import * as telemetry from '../../performance_analytics'

declare const global: telemetry.TelemetryGlobal

const performance_analytics: Hook<'command_not_found'> = async function (options) {
    global.cliTelemetry = telemetry.reportCmdNotFound(this.config)
}

export default performance_analytics
