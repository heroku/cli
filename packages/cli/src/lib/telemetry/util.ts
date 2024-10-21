import {ux} from '@oclif/core'

export function validateAndFormatSignal(signalInput: string | undefined): string[] {
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
