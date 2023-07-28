import {Hook} from '@oclif/core'

import Analytics from '../../analytics'
import * as telemetry from '../../global_telemetry'
import opentelemetry from '@opentelemetry/api'

declare const global: telemetry.TelemetryGlobal

const analytics: Hook<'prerun'> = async function (options) {
  // const tracer = opentelemetry.trace.getTracer('heroku-cli-tracer')
  // tracer.startActiveSpan('command.name.test', span => {
  //     span.setAttribute('command', 'test')
  //     span.end()
  // })
  global.cliTelemetry = telemetry.setupTelemetry(this.config, options)
  const analytics = new Analytics(this.config)
  await analytics.record(options)
}

export default analytics
