import {ux} from '@oclif/core'
import {TelemetryDrain} from '../types/telemetry'

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

export function displayTelemetryDrain(telemetryDrain: TelemetryDrain) {
  ux.styledHeader(telemetryDrain.id)
  const drainType = telemetryDrain.owner.type.charAt(0).toUpperCase() + telemetryDrain.owner.type.slice(1)
  ux.styledObject({
    [drainType]: telemetryDrain.owner.name,
    Signals: telemetryDrain.signals.join(', '),
    Endpoint: telemetryDrain.exporter.endpoint,
    Kind: telemetryDrain.exporter.type,
    Headers: telemetryDrain.exporter.headers,
  }, ['App', 'Space', 'Signals', 'Endpoint', 'Kind', 'Headers'])
}
