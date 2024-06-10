import {Hook} from '@oclif/core'

import Analytics from '../../analytics'
import * as telemetry from '../../global_telemetry'
import * as ipc from '../../cli-ipc'

declare const global: telemetry.TelemetryGlobal

const analytics: Hook<'prerun'> = async function (options) {
  if (process.env.IS_HEROKU_TEST_ENV === 'true') {
    return
  }

  global.cliTelemetry = telemetry.setupTelemetry(this.config, options)
  const analytics = new Analytics(this.config)
  await analytics.record(options)

  // create IPC connection here
  ipc.setupIPC(this.config, options)
}

export default analytics
