import {color, hux} from '@heroku/heroku-cli-util'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {TelemetryDrain} from '../types/telemetry.js'

interface TelemetryDisplayObject {
  App?: string
  Endpoint: string
  Headers?: string
  Signals: string
  Space?: string
  Transport: string
}

export function validateAndFormatSignals(signalInput: string | undefined): string[] {
  const signalOptions = ['traces', 'metrics', 'logs']
  if (!signalInput || signalInput === 'all') return signalOptions
  const signalArray = signalInput.split(',')
  signalArray.forEach(signal => {
    if (!signalOptions.includes(signal)) {
      ux.error(`Invalid signal option: ${signalArray}. Run heroku telemetry:add --help to see signal options.`, {exit: 1})
    }
  })
  return signalArray
}

export async function displayTelemetryDrain(telemetryDrain: TelemetryDrain, heroku: APIClient) {
  hux.styledHeader(telemetryDrain.id)

  // Start with an empty object
  const displayObject: Partial<TelemetryDisplayObject> = {}

  // Add App or Space first
  if (telemetryDrain.owner.type === 'space') {
    const {body: space} = await heroku.get<Heroku.Space>(`/spaces/${telemetryDrain.owner.id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    displayObject.Space = color.space(space.name || '')
  } else {
    const {body: app} = await heroku.get<Heroku.App>(`/apps/${telemetryDrain.owner.id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
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
