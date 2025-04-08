import {ux} from '@oclif/core'
import {TelemetryDrain} from '../types/telemetry'
import * as Heroku from '@heroku-cli/schema'
import {APIClient} from '@heroku-cli/command'

interface TelemetryDisplayObject {
  App?: string
  Space?: string
  Signals: string
  Endpoint: string
  Transport: string
  Headers?: string
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
  ux.styledHeader(telemetryDrain.id)
  const displayObject: TelemetryDisplayObject = {
    Signals: telemetryDrain.signals.join(', '),
    Endpoint: telemetryDrain.exporter.endpoint,
    Transport: (telemetryDrain.exporter.type === 'otlp' ? 'gRPC' : 'HTTP'),
  }

  if (telemetryDrain.owner.type === 'space') {
    const {body: space} = await heroku.get<Heroku.Space>(`/spaces/${telemetryDrain.owner.id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    displayObject.Space = space.name
  } else {
    const {body: app} = await heroku.get<Heroku.App>(`/apps/${telemetryDrain.owner.id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    displayObject.App = app.name
  }

  if (telemetryDrain.exporter.headers) {
    displayObject.Headers = JSON.stringify(telemetryDrain.exporter.headers)
  }

  ux.styledObject(displayObject, ['App', 'Space', 'Signals', 'Endpoint', 'Transport', 'Headers'])
}
