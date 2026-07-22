import type {TelemetryDrain} from '@heroku/types/3.sdk'

import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

type Platform = HerokuSDK['platform']

interface TelemetryDisplayObject {
  App?: string
  Endpoint: string
  Headers?: string
  Signals: string
  Space?: string
  Transport: string
}

export async function displayTelemetryDrain(telemetryDrain: TelemetryDrain, platform: Platform) {
  hux.styledHeader(telemetryDrain.id)

  // Start with an empty object
  const displayObject: Partial<TelemetryDisplayObject> = {}

  // Add App or Space first
  if (telemetryDrain.owner.type === 'space') {
    const space = await platform.space.info(telemetryDrain.owner.id)
    displayObject.Space = color.space(space.name || '')
  } else {
    const app = await platform.app.info(telemetryDrain.owner.id)
    displayObject.App = color.app(app.name || '')
  }

  // Add the other properties after App/Space
  displayObject.Signals = telemetryDrain.signals.join(', ')
  displayObject.Endpoint = telemetryDrain.exporter.endpoint
  displayObject.Transport = (telemetryDrain.exporter.type === 'otlp' ? 'gRPC' : 'HTTP')

  if (telemetryDrain.exporter.headers) {
    displayObject.Headers = JSON.stringify(telemetryDrain.exporter.headers)
  }

  hux.styledObject(displayObject, ['App', 'Space', 'Signals', 'Endpoint', 'Transport', 'Headers'])
}

export function validateAndFormatSignals(signalInput: string | undefined): Array<'logs' | 'metrics' | 'traces'> {
  const signalOptions = ['traces', 'metrics', 'logs']
  if (!signalInput || signalInput === 'all') return signalOptions as Array<'logs' | 'metrics' | 'traces'>
  const signalArray = signalInput.split(',')
  for (const signal of signalArray) {
    if (!signalOptions.includes(signal)) {
      ux.error(`Invalid signal option: ${signalArray}. Run heroku telemetry:add --help to see signal options.`, {exit: 1})
    }
  }

  return signalArray as Array<'logs' | 'metrics' | 'traces'>
}
