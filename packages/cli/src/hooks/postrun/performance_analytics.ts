import {Hook} from '@oclif/core'

import * as telemetry from '../../global_telemetry'

declare const global: telemetry.TelemetryGlobal

const performance_analytics: Hook<'postrun'> = async function () {
  if (process.env.IS_HEROKU_TEST_ENV === 'true' || !global.cliTelemetry) {
    return
  }

  const cmdStartTime = global.cliTelemetry.commandRunDuration
  global.cliTelemetry.commandRunDuration = telemetry.computeDuration(cmdStartTime)
  global.cliTelemetry.lifecycleHookCompletion.postrun = true
}

export default performance_analytics
